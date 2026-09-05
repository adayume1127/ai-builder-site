export type DialogueLine = {
  speaker: "zundamon" | "metan";
  text: string;
};

export type ExampleItem = {
  label: string;
  amount: number;
};

export type KakeiQuestExample = {
  title: string;
  note: string;
  items: ExampleItem[];
  caveat: string;
};

export type KakeiQuestDay = {
  day: number;
  slug: string;
  title: string;
  mission: string;
  summary: string;
  dialogue: DialogueLine[];
  action: string;
  example?: KakeiQuestExample;
};

export const KAKEI_QUEST_DAYS: KakeiQuestDay[] = [
  {
    day: 1,
    slug: "day1",
    title: "毎月絶対に出ていくお金を書き出す",
    mission: "毎月絶対に出ていくお金を書き出す",
    summary: "家賃・光熱費・通信費・保険・サブスクなど、金額がほぼ変わらない固定費を全部書き出してみよう。",
    dialogue: [
      { speaker: "zundamon", text: "今日から「30日家計改善クエスト」を始めるのだ!" },
      { speaker: "metan", text: "難しいことはしないから安心して。今日のミッションは1つだけよ。" },
      { speaker: "zundamon", text: "毎月絶対に出ていくお金を全部書き出すのだ!" },
      { speaker: "metan", text: "家賃、光熱費、通信費、保険、サブスクとか、金額が変わらないやつね。" },
      { speaker: "zundamon", text: "紙でもスマホのメモでもいいのだ?" },
      { speaker: "metan", text: "もちろん。金額を人に見せる必要もないわ。" },
      { speaker: "zundamon", text: "じゃあ何のために書き出すのだ?" },
      { speaker: "metan", text: "「毎月必ず出ていくお金」が分かると、残りをどう使うか考えやすくなるの。" },
      { speaker: "zundamon", text: "なるほど、家計の土台を知るってことなのだ!" },
      { speaker: "metan", text: "そういうこと。多くても少なくても、まずは数えることが大事よ。" },
      { speaker: "zundamon", text: "よし、ずんだもんも実際に自分のカード明細で数えてみたのだ!" },
      { speaker: "metan", text: "どうだった?" },
      { speaker: "zundamon", text: "数えたら8費目もあったのだ。家賃と光熱費が3つ、携帯代、仕事で使ってるツール代が3つくらいで、合計70,933円だったのだ。" },
      { speaker: "metan", text: "今回は特別に、金額込みの実例をこのページの下に見本として載せておくわね。みんなは金額を出さなくて大丈夫よ。" },
      { speaker: "zundamon", text: "「こんな感じで書けばいいのだ」ってイメージしてもらえたら嬉しいのだ!" },
      { speaker: "metan", text: "みんなも数え終わったら、費目がいくつあったかコメントで教えてね。金額はいらないから。" },
      { speaker: "zundamon", text: "明日はみんなの結果を紹介するのだ!お楽しみに!" },
    ],
    action: "紙かスマホのメモに、毎月絶対に出ていくお金(家賃・光熱費・通信費・保険・サブスクなど)を全部書き出してみよう。",
    example: {
      title: "運営者の実例(Day1)",
      note: "運営者本人が自分のクレジットカード明細から実際に拾い出した固定費です。金額を書くのは必須ではありません、あくまで「こんな感じで書き出せばOK」という見本です。",
      items: [
        { label: "家賃", amount: 42000 },
        { label: "ガス代", amount: 2578 },
        { label: "電気代", amount: 2253 },
        { label: "上下水道代", amount: 4400 },
        { label: "携帯代", amount: 3278 },
        { label: "仕事のAIツール利用料(サブスク+従量課金)", amount: 11111 },
        { label: "サーバー・ホスティング費", amount: 3431 },
        { label: "ドメイン代", amount: 1882 },
      ],
      caveat:
        "家賃・上下水道代・携帯代は別途確認して追加しました。保険料はこのカード明細に載っていませんでした(別払いのため)。人によってカードにまとまる費目は違うので、通帳や他の支払い方法も合わせて確認するのがおすすめです。",
    },
  },
  {
    day: 2,
    slug: "day2",
    title: "覚えてない支出を1つ見つける",
    mission: "覚えてない支出を1つ見つける",
    summary: "先月のクレジットカードや決済アプリの明細を見返して、「これ何に使ったか覚えてない支出」を1つ探してみよう。",
    dialogue: [
      { speaker: "zundamon", text: "30日クエストDay2、始まるのだ!" },
      { speaker: "metan", text: "昨日は、費目の数を教えてくれた人がたくさんいたわね。" },
      { speaker: "zundamon", text: "平均7〜8個くらいだったのだ!多い人は15個もいたのだ。" },
      { speaker: "metan", text: "そんなに把握してる人が多いなんて、いい傾向ね。" },
      { speaker: "zundamon", text: "今日のミッションは何なのだ?" },
      { speaker: "metan", text: "先月の明細を見て、「これ何に使ったか覚えてない支出」を1つ見つけてほしいの。" },
      { speaker: "zundamon", text: "え、そんなのあるのだ?" },
      { speaker: "metan", text: "クレジットカードやスマホ決済の明細、意外と見返さない人が多いのよ。" },
      { speaker: "zundamon", text: "コンビニでちょこちょこ買ったやつとか、怪しいのだ..." },
      { speaker: "metan", text: "そう。サブスクの解約し忘れも定番ね。" },
      { speaker: "zundamon", text: "ずんだもんも明細を見返してみたのだ。" },
      { speaker: "metan", text: "何か見つかった?" },
      { speaker: "zundamon", text: "使ってるはずなのに、金額だけ見ると一瞬「これ何だっけ」ってなるやつがあったのだ。よく見たら心当たりはあったから一安心なのだ。" },
      { speaker: "metan", text: "それでも十分な収穫よ。責める必要はないの。「見返す習慣」ができたことが進歩なんだから。" },
      { speaker: "zundamon", text: "見つかったか見つからなかったか、コメントで教えてほしいのだ!" },
      { speaker: "metan", text: "明日はその結果を紹介するわね。" },
    ],
    action: "先月のクレジットカードや決済アプリの明細を見返して、「これ何に使ったか覚えてない支出」を1つ探してみよう。",
  },
  {
    day: 3,
    slug: "day3",
    title: "生活防衛資金が何ヶ月分あるか計算する",
    mission: "生活防衛資金が何ヶ月分あるか計算する",
    summary: "今の貯金を1ヶ月の生活費で割って、「もしもの時に何ヶ月生きられるか」を計算してみよう。",
    dialogue: [
      { speaker: "zundamon", text: "30日クエストDay3、始まるのだ!" },
      { speaker: "metan", text: "昨日は「見つかった」って報告してくれた人が多かったわね。" },
      { speaker: "zundamon", text: "サブスクの解約し忘れが一番多かったのだ!" },
      { speaker: "metan", text: "あるあるね。今日はちょっと計算してもらうわよ。" },
      { speaker: "zundamon", text: "今の貯金を、1ヶ月の生活費で割ればいいのだ?" },
      { speaker: "metan", text: "そう。それで「もしもの時に何ヶ月生きられるか」が分かるの。" },
      { speaker: "zundamon", text: "生活防衛資金ってやつなのだ!" },
      { speaker: "metan", text: "そう。急な病気や失業にも備えられる大事な数字よ。" },
      { speaker: "zundamon", text: "一般的には何ヶ月あればいいのだ?" },
      { speaker: "metan", text: "生活スタイルにもよるけど、3〜6ヶ月分が一つの目安と言われているわ。" },
      { speaker: "zundamon", text: "ずんだもんも計算してみたのだ!" },
      { speaker: "metan", text: "何ヶ月分だった?" },
      { speaker: "zundamon", text: "ちょうど目安の範囲に収まってて、ちょっと安心したのだ。" },
      { speaker: "metan", text: "1ヶ月分もない人もいるかもしれないけど、責める話じゃないの。今の月数を知ることが大事よ。" },
      { speaker: "zundamon", text: "1ヶ月未満/1〜3ヶ月/3〜6ヶ月/6ヶ月以上、どれだったかコメントで教えてほしいのだ!" },
      { speaker: "metan", text: "明日はみんなの結果を紹介するわね。" },
    ],
    action: "今の貯金額を、1ヶ月の生活費で割って「生活防衛資金が何ヶ月分あるか」を計算してみよう。",
  },
  {
    day: 4,
    slug: "day4",
    title: "貯金の目的を1つ決める",
    mission: "貯金の目的を1つ決める",
    summary: "「何のために・いつまでに」貯めたいか、貯金の目的を1つ決めてみよう。金額は決めなくてOK。",
    dialogue: [
      { speaker: "zundamon", text: "30日クエストDay4、始まるのだ!" },
      { speaker: "metan", text: "昨日は生活防衛資金の月数、いろんな結果が集まったわね。" },
      { speaker: "zundamon", text: "3〜6ヶ月って答えた人が一番多かったのだ!" },
      { speaker: "metan", text: "良い傾向ね。今日は「貯金の目的」を1つ決めてもらうわよ。" },
      { speaker: "metan", text: "「何のために・いつまでに・いくら」貯めたいか、を考えるの。" },
      { speaker: "zundamon", text: "金額は言わなくていいのだ?" },
      { speaker: "metan", text: "もちろん。今日は目的だけ、頭の中か紙に書き出せればOKよ。" },
      { speaker: "zundamon", text: "旅行とか結婚とか、家を買うとか、そういうやつなのだ?" },
      { speaker: "metan", text: "そうそう。老後資金や子供の教育費でもいいわ。" },
      { speaker: "zundamon", text: "ずんだもんも決めてみたのだ!" },
      { speaker: "metan", text: "何にしたの?" },
      { speaker: "zundamon", text: "秘密なのだ。でも目的が決まったら、なんとなく貯めてた頃より頑張れる気がするのだ!" },
      { speaker: "metan", text: "そう、「なんとなく貯める」から「◯◯のために貯める」に変わると続けやすくなるのよ。" },
      { speaker: "zundamon", text: "決まったら、目的だけコメントで教えてほしいのだ!金額はいらないのだ。" },
      { speaker: "metan", text: "明日はみんなの目的を紹介するわね。" },
    ],
    action: "「何のために・いつまでに」貯めたいか、貯金の目的を1つ決めてみよう。金額は決めなくてOK。",
  },
  {
    day: 5,
    slug: "day5",
    title: "今月自由に使えるお金を計算する",
    mission: "今月自由に使えるお金を計算する",
    summary: "手取り収入から、固定費(Day1)と貯金額を引いて、今月本当に自由に使えるお金を計算してみよう。",
    dialogue: [
      { speaker: "zundamon", text: "30日クエストDay5、始まるのだ!" },
      { speaker: "metan", text: "昨日はいろんな貯金の目的が集まったわね。旅行や家、老後資金まで。" },
      { speaker: "zundamon", text: "みんな色々考えてるのだ!" },
      { speaker: "metan", text: "今日は「今月自由に使えるお金」を計算してもらうわよ。" },
      { speaker: "metan", text: "手取り収入から、固定費と貯金額を引くだけよ。" },
      { speaker: "zundamon", text: "Day1で書き出した固定費が、ここで役に立つのだ!" },
      { speaker: "metan", text: "そういうこと。全部つながっているの。" },
      { speaker: "zundamon", text: "貯金額って、いくらで計算すればいいのだ?" },
      { speaker: "metan", text: "決まってなければ、まずは手取りの1割くらいで仮計算してみて。" },
      { speaker: "zundamon", text: "手取り引く固定費引く貯金額...計算してみたのだ!" },
      { speaker: "metan", text: "思ったより多かった?少なかった?" },
      { speaker: "zundamon", text: "正直、思ってたより少なくてちょっとびっくりしたのだ。でも数字で見えると逆に安心するのだ。" },
      { speaker: "metan", text: "分かる。「なんとなく不安」から「これだけ使える」に変わるだけで、気持ちがだいぶ楽になるのよね。" },
      { speaker: "zundamon", text: "結果をコメントで教えてほしいのだ!" },
      { speaker: "metan", text: "明日は最後のミッションよ。" },
    ],
    action: "手取り収入から、固定費(Day1)と貯金額を引いて、今月自由に使えるお金を計算してみよう。",
  },
  {
    day: 6,
    slug: "day6",
    title: "1週間、支出の記録を始める",
    mission: "1週間、支出の記録を始める",
    summary: "今日から1週間、レシートや家計簿アプリなど、やりやすい方法で支出を記録し始めてみよう。完璧じゃなくてOK。",
    dialogue: [
      { speaker: "zundamon", text: "30日クエストDay6、始まるのだ!" },
      { speaker: "metan", text: "昨日は「使えるお金」、思ったより多かった人も少なかった人もいたわね。" },
      { speaker: "zundamon", text: "どっちの人も、計算できただけで進歩なのだ!" },
      { speaker: "metan", text: "そういうこと。今日はいよいよ最後のミッションよ。" },
      { speaker: "metan", text: "今日から1週間、支出を記録し始めてほしいの。" },
      { speaker: "zundamon", text: "レシートを取っておくのだ?" },
      { speaker: "metan", text: "それでもいいし、家計簿アプリを使ってもいいわ。やりやすい方法でOKよ。" },
      { speaker: "zundamon", text: "完璧に記録しなきゃダメなのだ?" },
      { speaker: "metan", text: "ううん、完璧じゃなくていいの。まずは1週間、続けることが目標。" },
      { speaker: "zundamon", text: "これまでのミッションが、全部つながってきたのだ!" },
      { speaker: "metan", text: "固定費を知って、防衛資金を計算して、目的と使えるお金も分かった。" },
      { speaker: "zundamon", text: "あとは記録するだけで、家計の全体像が見えてくるのだ!" },
      { speaker: "metan", text: "そう。今日は結果じゃなくて、「宣言」だけでいいの。" },
      { speaker: "zundamon", text: "「今日から始めます」って、コメントするだけなのだ!" },
      { speaker: "zundamon", text: "明日はついに最終回、Day7なのだ!" },
    ],
    action: "今日から1週間、レシートや家計簿アプリなど、やりやすい方法で支出を記録し始めてみよう。完璧じゃなくてOK。",
  },
  {
    day: 7,
    slug: "day7",
    title: "6日間を振り返る",
    mission: "6日間を振り返る",
    summary: "固定費・謎支出・生活防衛資金・貯金目的・使えるお金・支出記録、6日間のミッションを振り返ろう。",
    dialogue: [
      { speaker: "zundamon", text: "ついに30日クエストのDay7、最終日なのだ!" },
      { speaker: "metan", text: "6日間、お疲れ様。今日は振り返りよ。" },
      { speaker: "zundamon", text: "固定費を数えて、謎支出を探して、生活防衛資金を計算したのだ。" },
      { speaker: "metan", text: "貯金目標を決めて、使えるお金を計算して、記録も始めた。" },
      { speaker: "zundamon", text: "一番大変だったのはどれだったのだ?コメントで教えてほしいのだ!" },
      { speaker: "metan", text: "これ、実は毎月手作業でやるのは正直しんどいのよね。" },
      { speaker: "zundamon", text: "え、そうなのだ?" },
      { speaker: "metan", text: "だから同じ流れを自動でやってくれる「積立クエスト」ってツールを作ったの。" },
      { speaker: "zundamon", text: "今日までのミッション、全部このツールでできるのだ?" },
      { speaker: "metan", text: "そう。しかも今なら、一緒にやる仲間を募集してるオープンチャットもあるわ。" },
      { speaker: "zundamon", text: "一人で続かなかった人は、仲間と一緒にやるといいのだ!" },
      { speaker: "metan", text: "このページの下にリンクを貼っておくから、気になった人だけ覗いてみてね。" },
      { speaker: "zundamon", text: "6日間、本当にお疲れ様なのだ!また続きも一緒にやろうなのだ!" },
    ],
    action: "6日間のミッションを振り返って、一番大変だったこと・一番の発見をコメントで教えてね。",
  },
];

export function getKakeiQuestDay(slug: string): KakeiQuestDay | undefined {
  return KAKEI_QUEST_DAYS.find((d) => d.slug === slug);
}
