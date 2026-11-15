// The critical chain hands off on the same day, so it has no slack: Kickoff →
// Requirements → Wireframes → Visual design → Front end → QA → Launch.
const schedule = [
  {
    task: "Kickoff",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-04",
  },
  {
    task: "Requirements",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-13",
    dependencies: ["Kickoff"],
  },
  {
    task: "Content audit",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-08",
    dependencies: ["Kickoff"],
  },
  {
    task: "Wireframes",
    phase: "Design",
    start: "2024-03-13",
    end: "2024-03-22",
    dependencies: ["Requirements"],
  },
  {
    task: "Copywriting",
    phase: "Design",
    start: "2024-03-11",
    end: "2024-03-27",
    dependencies: ["Content audit"],
  },
  {
    task: "Visual design",
    phase: "Design",
    start: "2024-03-22",
    end: "2024-04-05",
    dependencies: ["Wireframes"],
  },
  {
    task: "API",
    phase: "Build",
    start: "2024-03-13",
    end: "2024-04-03",
    dependencies: ["Requirements"],
  },
  {
    task: "Front end",
    phase: "Build",
    start: "2024-04-05",
    end: "2024-04-24",
    dependencies: ["Visual design", "API"],
  },
  {
    task: "Content entry",
    phase: "Build",
    start: "2024-03-27",
    end: "2024-04-10",
    dependencies: ["Copywriting"],
  },
  {
    task: "QA",
    phase: "Launch",
    start: "2024-04-24",
    end: "2024-05-03",
    dependencies: ["Front end", "Content entry"],
  },
  {
    task: "Launch",
    phase: "Launch",
    start: "2024-05-03",
    end: "2024-05-03",
    dependencies: ["QA"],
  },
];

const config = {
  data: schedule,
  groupBy: "task",
  color: "phase",
};
