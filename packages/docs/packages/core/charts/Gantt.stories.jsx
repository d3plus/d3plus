// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Gantt} from "../../../args/core/charts/Gantt.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Gantt",
  component: Gantt,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Creates a Gantt chart from an array of tasks: one labeled row per task,\nits bar running from start to end over a time axis. Tasks can be\ngrouped into phases (group), drawn as milestones (milestone), linked\nby dependency arrows (dependencies), and filled by their progress,\nwith an optional today line.",
      },
    },
  },
};

const Template = args => <Gantt config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const schedule = [
  {
    task: "Kickoff",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-04",
    progress: 1,
  },
  {
    task: "Stakeholder interviews",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-13",
    progress: 1,
    dependencies: ["Kickoff"],
  },
  {
    task: "Requirements",
    phase: "Discovery",
    start: "2024-03-11",
    end: "2024-03-22",
    progress: 1,
    dependencies: ["Stakeholder interviews"],
  },
  {
    task: "Sign-off",
    phase: "Discovery",
    start: "2024-03-22",
    end: "2024-03-22",
    progress: 1,
    dependencies: ["Requirements"],
  },
  {
    task: "Wireframes",
    phase: "Design",
    start: "2024-03-25",
    end: "2024-04-05",
    progress: 0.8,
    dependencies: ["Sign-off"],
  },
  {
    task: "Visual design",
    phase: "Design",
    start: "2024-04-01",
    end: "2024-04-19",
    progress: 0.4,
    dependencies: ["Wireframes"],
  },
  {
    task: "Design review",
    phase: "Design",
    start: "2024-04-19",
    end: "2024-04-19",
    progress: 0,
    dependencies: ["Visual design"],
  },
  {
    task: "API",
    phase: "Build",
    start: "2024-03-25",
    end: "2024-04-26",
    progress: 0.5,
    dependencies: ["Sign-off"],
  },
  {
    task: "Front end",
    phase: "Build",
    start: "2024-04-15",
    end: "2024-05-10",
    progress: 0.1,
    dependencies: ["Wireframes", "API"],
  },
  {
    task: "Testing",
    phase: "Launch",
    start: "2024-05-06",
    end: "2024-05-17",
    progress: 0,
    dependencies: ["Front end"],
  },
  {
    task: "Go live",
    phase: "Launch",
    start: "2024-05-20",
    end: "2024-05-20",
    dependencies: ["Testing"],
  },
];

const plain = schedule.map(({task, start, end}) => ({task, start, end}));

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: plain,
  groupBy: "task",
};
BasicExample.parameters = {
  controls: {include: ["start", "end", "taskSort", "labelWidth"]},
  docs: {
    description: {
      story:
        "Each task gets its own row, labeled in the column on the left, with a bar from its `start` to its `end` on the time axis along the top. A task that starts and ends on the same day is a milestone, drawn as a diamond.",
    },
  },
};

export const Dependencies = Template.bind({});
Dependencies.args = {
  data: schedule.map(({task, start, end, dependencies}) => ({
    task,
    start,
    end,
    dependencies,
  })),
  groupBy: "task",
};
Dependencies.parameters = {
  controls: {include: ["dependencies", "dependencyConfig"]},
  docs: {
    description: {
      story:
        "Each task's `dependencies` lists the ids of the tasks it waits on. An arrow leaves each predecessor's end and turns into the dependent's start; when the dependent starts before there is room to turn, the arrow doubles back between the rows. Arrows take the chart's text color at reduced opacity, and stay lit when either end is hovered.",
    },
  },
};

export const Progress = Template.bind({});
Progress.args = {
  data: schedule,
  groupBy: "task",
  color: "phase",
  today: "2024-04-10",
};
Progress.parameters = {
  controls: {include: ["progress", "today", "todayConfig"]},
  docs: {
    description: {
      story:
        "A task's `progress` (a fraction such as `0.6`, or a percent string such as `\"60%\"`) fills that share of its bar in the task's color, and leaves the rest in a paler shade. A milestone not yet reached draws pale and outlined. `today` marks a date with a labeled line; `today: true` marks the current time.",
    },
  },
};

export const Phases = Template.bind({});
Phases.args = {
  data: schedule,
  groupBy: "task",
  group: "phase",
  color: "phase",
  legend: false,
};
Phases.parameters = {
  controls: {include: ["group", "taskSort", "taskLabelConfig"]},
  docs: {
    description: {
      story:
        '`group` gathers tasks under a header row for each phase, with a bracket spanning its tasks; the tasks indent beneath it. Groups appear in the order of their first task, so `taskSort: "start"` orders both.',
    },
  },
};

export const DrillingIntoPhases = Template.bind({});
DrillingIntoPhases.args = {
  data: schedule,
  groupBy: ["phase", "task"],
  depth: 0,
};
DrillingIntoPhases.parameters = {
  controls: {include: ["groupBy", "depth"]},
  docs: {
    description: {
      story:
        "With two `groupBy` levels, the chart starts with one bar per phase, spanning its earliest start to its latest end with its tasks' average progress. Clicking a phase drills into its tasks, and Back steps out.",
    },
  },
};

export const WorkingDays = Template.bind({});
WorkingDays.args = {
  data: schedule.slice(0, 7),
  groupBy: "task",
  axisConfig: {rangeBreaks: "weekends"},
};
WorkingDays.parameters = {
  controls: {include: ["axisConfig"]},
  docs: {
    description: {
      story:
        '`axisConfig.rangeBreaks` hides time on the axis: `"weekends"` closes up Saturdays and Sundays, so bars show working days.',
    },
  },
};
