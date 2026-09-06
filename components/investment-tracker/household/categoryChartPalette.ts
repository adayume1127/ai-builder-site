// カテゴリ別グラフ(円グラフ・推移グラフ)の共通配色。
// dataviz原則に沿い、CVD(色覚多様性)シミュレーション下でも隣接区分を区別できるよう
// 検証済みの固定順の色相を使う(自己流の目視選定ではない)。
// 検証コマンド: node scripts/validate_palette.js "#3987e5,#d95926,#199e70,#c98500,#d55181" \
//   --mode dark --surface "#05050d"(本アプリの実際の背景色) → 全項目PASS。
export const CATEGORY_SLOT_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"] as const;
// 「その他」は個別カテゴリのアイデンティティではなく残余バケットのため、
// 上記の識別用色相とは別に中立なグレーを割り当てる(色をランクではなくエンティティに従わせる原則の一部)。
export const OTHER_SLICE_COLOR = "rgba(255,255,255,0.35)";

export function colorForCategoryId(categoryId: string, slots: { categoryId: string }[]): string {
  const index = slots.findIndex((s) => s.categoryId === categoryId);
  if (index === -1) return OTHER_SLICE_COLOR;
  return CATEGORY_SLOT_COLORS[index % CATEGORY_SLOT_COLORS.length];
}
