// ═══════════════════════════════════════════════════════════════
//  キャラクター「スタッピー」の画像（このフォルダーの images/ にある）
//    import { IMAGES } from "../object/character/images.js";   →   <img src={IMAGES.main}>
//  new URL(…, import.meta.url) と書くと、開発中もアプリにしたあとも、正しい場所を指してくれます
//  ※ スタート画面（start-end/loading-screen.html）だけは HTML に直接
//     "/src/system/object/character/images/stabee_pose_jump.png" と書いています（プログラムより先に出すため）
// ═══════════════════════════════════════════════════════════════
export const IMAGES = {
  /** ふつうの立ち姿（本を持って手をふる） */
  main: new URL("./images/stabee_main.png", import.meta.url).href,
  /** うれしくて跳ねている姿（目はにっこり） */
  jump: new URL("./images/stabee_pose_jump.png", import.meta.url).href,
};
