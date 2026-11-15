// Every mammal is an animal and every dog a mammal, so those overlaps are
// as large as the smaller set; plants share nothing with animals.
const living = [
  {sets: ["Animals"], size: 100},
  {sets: ["Mammals"], size: 30},
  {sets: ["Dogs"], size: 6},
  {sets: ["Plants"], size: 45},
  {sets: ["Animals", "Mammals"], size: 30},
  {sets: ["Animals", "Dogs"], size: 6},
  {sets: ["Dogs", "Mammals"], size: 6},
  {sets: ["Animals", "Dogs", "Mammals"], size: 6},
];

const config = {
  data: living,
};
