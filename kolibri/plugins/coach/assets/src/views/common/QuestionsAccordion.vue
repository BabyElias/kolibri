<template>

  <AccordionContainer>
    <template #header="{ canExpandAll, expandAll, canCollapseAll, collapseAll }">
      <div class="questions-accordion-header">
        <div>
          <KCheckbox
            ref="selectAllCheckbox"
            class="select-all-box"
            :label="selectAllLabel$()"
            :checked="selectAllIsChecked"
            :indeterminate="selectAllIsIndeterminate"
            @change="$emit('selectAll', $event)"
            @click.stop="() => {}"
          />
        </div>
        <div class="trailing-actions">
          <KIconButton
            icon="expandAll"
            :tooltip="expandAll$()"
            :disabled="!canExpandAll"
            @click="expandAll"
          />
          <KIconButton
            icon="collapseAll"
            :tooltip="collapseAll$()"
            :disabled="!canCollapseAll"
            @click="collapseAll"
          />
          <slot name="header-trailing-actions"></slot>
        </div>
      </div>
    </template>

    <DragContainer
      key="drag-container"
      :items="questions"
      @sort="handleQuestionOrderChange"
      @dragStart="handleDragStart"
    >
      <transition-group
        tag="div"
        name="list"
      >
        <Draggable
          v-for="(question, index) in questions"
          :key="`drag-${question.item}`"
          tabindex="-1"
          :style="{
            background: $themeTokens.surface,
          }"
        >
          <AccordionItem
            :title="displayQuestionTitle(question, getQuestionContent(question).title)"
            :aria-selected="selectedQuestions.includes(question.item)"
            :headerAppearanceOverrides="{
              userSelect: dragActive ? 'none !important' : 'text',
            }"
          >
            <template #leading-actions>
              <DragHandle>
                <div>
                  <DragSortWidget
                    :moveUpText="upLabel$"
                    :moveDownText="downLabel$"
                    :noDrag="true"
                    :isFirst="index === 0"
                    :isLast="index === questions.length - 1"
                    @moveUp="() => handleKeyboardDragUp(index)"
                    @moveDown="() => handleKeyboardDragDown(index)"
                  />
                </div>
              </DragHandle>
              <KCheckbox
                class="accordion-item-checkbox"
                :checked="selectedQuestions.includes(question.item)"
                @change="
                  (value, $event) => handleQuestionCheckboxChange(question.item, value, $event)
                "
              />
            </template>
            <template #content>
              <div
                :id="`question-panel-${question.item}`"
                :style="{ userSelect: dragActive ? 'none !important' : 'text' }"
              >
                <ContentRenderer
                  :ref="`contentRenderer-${question.item}`"
                  :kind="getQuestionContent(question).kind"
                  :lang="getQuestionContent(question).lang"
                  :files="getQuestionContent(question).files"
                  :available="getQuestionContent(question).available"
                  :itemId="question.question_id"
                  :assessment="true"
                  :allowHints="false"
                  :interactive="false"
                  @interaction="() => null"
                  @updateProgress="() => null"
                  @updateContentState="() => null"
                  @error="err => $emit('error', err)"
                />
              </div>
            </template>
          </AccordionItem>
        </Draggable>
      </transition-group>
    </DragContainer>
  </AccordionContainer>

</template>


<script>

  import { ref } from 'vue';
  import {
    enhancedQuizManagementStrings,
    displayQuestionTitle,
  } from 'kolibri-common/strings/enhancedQuizManagementStrings';
  import Draggable from 'kolibri-common/components/sortable/Draggable';
  import DragHandle from 'kolibri-common/components/sortable/DragHandle';
  import DragContainer from 'kolibri-common/components/sortable/DragContainer';
  import DragSortWidget from 'kolibri-common/components/sortable/DragSortWidget';
  import AccordionItem from 'kolibri-common/components/accordion/AccordionItem';
  import AccordionContainer from 'kolibri-common/components/accordion/AccordionContainer';
  import { searchAndFilterStrings } from 'kolibri-common/strings/searchAndFilterStrings';
  import useDrag from './useDrag.js';

  export default {
    name: 'QuestionsAccordion',
    components: {
      Draggable,
      DragHandle,
      DragContainer,
      DragSortWidget,
      AccordionItem,
      AccordionContainer,
    },
    setup() {
      const dragActive = ref(false);

      const { upLabel$, downLabel$ } = searchAndFilterStrings;
      const { selectAllLabel$, expandAll$, collapseAll$ } = enhancedQuizManagementStrings;

      const { moveUpOne, moveDownOne } = useDrag();

      return {
        moveUpOne,
        moveDownOne,
        dragActive,
        displayQuestionTitle,
        upLabel$,
        downLabel$,
        selectAllLabel$,
        expandAll$,
        collapseAll$,
      };
    },
    props: {
      questions: {
        type: Array,
        required: true,
      },
      getQuestionContent: {
        type: Function,
        required: true,
      },
      selectedQuestions: {
        type: Array,
        required: true,
      },
      selectAllIsChecked: {
        type: Boolean,
        required: false,
      },
      selectAllIsIndeterminate: {
        type: Boolean,
        required: false,
      },
    },
    methods: {
      handleDragStart() {
        // Used to mitigate the issue of text being selected while dragging
        this.dragActive = true;
      },
      handleQuestionOrderChange({ newArray }) {
        this.$emit('sort', { newArray });
        this.dragActive = false;
      },
      handleKeyboardDragDown(oldIndex) {
        const newArray = this.moveDownOne(oldIndex, this.questions);
        this.handleQuestionOrderChange({ newArray });
      },
      handleKeyboardDragUp(oldIndex) {
        const newArray = this.moveUpOne(oldIndex, this.questions);
        this.handleQuestionOrderChange({ newArray });
      },
      handleQuestionCheckboxChange(questionItem, value, $event) {
        $event.stopPropagation();
        this.$emit('select', questionItem, value);
      },
    },
  };

</script>


<style lang="scss" scoped>

  .questions-accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-left: 8px;

    .select-all-box {
      margin-top: 0;
      margin-bottom: 0;
      margin-left: 1.5em;

      // Vertical centering here into the KCheckbox
      /deep/ & label {
        line-height: 28px;
      }
    }

    .trailing-actions {
      display: flex;
      align-items: center;
    }
  }

  .accordion-item-checkbox {
    margin-left: 0.5em;
  }

</style>
