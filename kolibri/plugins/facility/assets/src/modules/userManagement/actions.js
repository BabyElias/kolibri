import isEmpty from 'lodash/isEmpty';
import { UserKinds } from 'kolibri/constants';
import FacilityUserResource from 'kolibri-common/apiResources/FacilityUserResource';
import samePageCheckGenerator from 'kolibri-common/utils/samePageCheckGenerator';
import pickBy from 'lodash/pickBy';
import { _userState } from '../mappers';
import { updateFacilityLevelRoles } from './utils';


/**
 * Fetch facility users with sorting applied based on the column clicked
 * @param {Object} store - Vuex store
 * @param {Object} payload - Contains the column and order information
 * @param {string} payload.column - The name of the column to sort by
 * @param {string} payload.order - The sort order ("asc", "desc", or null)
 */
export function fetchSortedFacilityUsers(store, { column, order }) {
  store.commit('SET_STATE', { dataLoading: true });

  const orderingParam = order === 'desc' ? `-${column}` : column || null;
  const shouldResolve = samePageCheckGenerator(store);

  return FacilityUserResource.fetchCollection({
    getParams: pickBy({
      ordering: orderingParam, // Pass the ordering parameter
    }),
    force: true,
  })
    .then(users => {
      if (shouldResolve()) {
        // Map the response data to state as required
        store.commit('SET_STATE', {
          facilityUsers: users.map(_userState),
        });
      }
      store.commit('SET_STATE', { dataLoading: false });
      store.dispatch('notLoading');
    })
    .catch(error => {
      shouldResolve() ? store.dispatch('handleApiError', { error, reloadOnReconnect: true },{root: true}) : null;
      store.commit('SET_STATE', { dataLoading: false });
      store.dispatch('notLoading');
    });
}
/**
 * Does a POST request to assign a user role (only used in this file)
 * @param {Object} user
 * @param {string} user.id
 * @param {string} user.facility
 * @param {string} user.roles
 * Needed: id, facility, role
 */
function setUserRole(user, role) {
  return updateFacilityLevelRoles(user, role.kind).then(() => {
    // Force refresh the User to get updated roles
    return FacilityUserResource.fetchModel({ id: user.id, force: true });
  });
}

/**
 * Do a POST to create new user
 * @param {object} stateUserData
 *  Needed: username, full_name, facility, role, password
 */
export function createFacilityUser(store, payload) {
  return FacilityUserResource.saveModel({
    data: {
      facility: store.rootGetters.activeFacilityId,
      username: payload.username,
      full_name: payload.full_name,
      password: payload.password,
      id_number: payload.id_number,
      gender: payload.gender,
      birth_year: payload.birth_year,
      extra_demographics: payload.extra_demographics,
    },
  }).then(facilityUser => {
    if (payload.role.kind !== UserKinds.LEARNER) {
      return setUserRole(facilityUser, payload.role);
    }
  });
}

export function updateFacilityUserDetails(store, { userId, updates }) {
  const { facilityUserUpdates, roleUpdates } = updates;
  if (isEmpty(facilityUserUpdates) && !roleUpdates) {
    return Promise.resolve();
  }
  return FacilityUserResource.saveModel({ id: userId, data: { ...facilityUserUpdates } }).then(
    user => {
      if (roleUpdates) {
        return updateFacilityLevelRoles(user, roleUpdates.kind);
      }
    },
  );
}

export function updateFacilityUserPassword(store, { userId, password }) {
  return FacilityUserResource.saveModel({ id: userId, data: { password } });
}

export function deleteFacilityUser(store, { userId }) {
  return FacilityUserResource.deleteModel({ id: userId });
}
