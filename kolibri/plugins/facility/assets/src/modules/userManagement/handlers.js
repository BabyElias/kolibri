import pickBy from 'lodash/pickBy';
import FacilityUserResource from 'kolibri-common/apiResources/FacilityUserResource';
import samePageCheckGenerator from 'kolibri-common/utils/samePageCheckGenerator';
import { _userState } from '../mappers';

export function fetchSortedFacilityUsersHandler(store, { column, order }) {
  store.commit('userManagement/SET_STATE', { dataLoading: true });

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
        // Map the response data to your state as required
        store.commit('userManagement/SET_STATE', {
          facilityUsers: users.results.map(_userState),
          totalPages: users.total_pages,
          usersCount: users.count,
        });
      }
      store.commit('userManagement/SET_STATE', { dataLoading: false });
      store.dispatch('notLoading');
    })
    .catch(error => {
      shouldResolve() ? store.dispatch('handleApiError', { error, reloadOnReconnect: true }) : null;
      store.commit('userManagement/SET_STATE', { dataLoading: false });
      store.dispatch('notLoading');
    });
}
// An action for setting up the initial state of the app by fetching data from the server
export function showUserPage(store, toRoute, fromRoute) {
  store.commit('userManagement/SET_STATE', { dataLoading: true });
  if (toRoute.name !== fromRoute.name) {
    store.dispatch('preparePage');
  }
  const facilityId = toRoute.params.facility_id || store.getters.activeFacilityId;
  const shouldResolve = samePageCheckGenerator(store);
  return FacilityUserResource.fetchCollection({
    getParams: pickBy({
      member_of: facilityId,
      page: toRoute.query.page || 1,
      page_size: toRoute.query.page_size || 30,
      search: toRoute.query.search && toRoute.query.search.trim(),
      user_type: toRoute.query.user_type,
    }),
    force: true,
  })
    .then(users => {
      if (shouldResolve()) {
        store.commit('userManagement/SET_STATE', {
          facilityUsers: users.results.map(_userState),
          totalPages: users.total_pages,
          usersCount: users.count,
        });
      }
      store.commit('userManagement/SET_STATE', { dataLoading: false });
      store.dispatch('notLoading');
    })
    .catch(error => {
      shouldResolve() ? store.dispatch('handleApiError', { error, reloadOnReconnect: true }) : null;
      store.commit('userManagement/SET_STATE', { dataLoading: false });
      store.dispatch('notLoading');
    });
}
