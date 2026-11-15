const ages = [
  {age: 0, group: "Children", people: 412},
  {age: 5, group: "Children", people: 448},
  {age: 10, group: "Children", people: 471},
  {age: 15, group: "Children", people: 459},
  {age: 20, group: "Adults", people: 503},
  {age: 25, group: "Adults", people: 548},
  {age: 30, group: "Adults", people: 572},
  {age: 35, group: "Adults", people: 561},
  {age: 40, group: "Adults", people: 527},
  {age: 45, group: "Adults", people: 498},
  {age: 50, group: "Adults", people: 476},
  {age: 55, group: "Adults", people: 441},
  {age: 60, group: "Adults", people: 398},
  {age: 65, group: "Seniors", people: 342},
  {age: 70, group: "Seniors", people: 268},
  {age: 75, group: "Seniors", people: 191},
  {age: 80, group: "Seniors", people: 118},
  {age: 85, group: "Seniors", people: 64},
];

const config = {
  data: ages,
  groupBy: "group",
  x: "age",
  value: "people",
  unit: 50,
};
