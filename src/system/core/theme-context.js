// ═══════════════════════════════════════════════════════════════
//  ダーク／ホワイトの切り替えを、どのページからでも使えるようにする入れ物
//    中身は core/App.jsx が入れる：{ theme: "light" か "dark"（今の見た目）, toggle()（反対にする） }
//    使い方：const t = useContext(ThemeContext);  t.toggle();
//    使っているところ：core/components/PageBar.jsx（上のバーの右はしの切り替えボタン）
// ═══════════════════════════════════════════════════════════════
import { createContext } from "react";

export const ThemeContext = createContext(null);   // App.jsx の外（ログインの画面など）では null
