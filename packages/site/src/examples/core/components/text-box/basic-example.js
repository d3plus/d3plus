const config = {
  data: [
    {
      text: "Here is text rendered in <i>SVG</i> that is <u>wrapped</u> and contains <b>HTML</b> tags.",
    },
    {text: "这是句子 2。即使包装器中没有空格，它也有效！"},
    {
      text: "၎င်းသည် ချိတ်ဆက်ထားသော စာလုံးများပင်လျှင် ဘာသာစကားအများစုတွင် အလုပ်လုပ်သည်။",
    },
  ],
  duration: 500,
  fontSize: 16,
  height: 200,
  lineHeight: 18,
  text: d => d.text,
  width: 200,
  x: (d, i) => i * (200 + 50),
};
