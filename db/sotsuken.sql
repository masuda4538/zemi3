-- ============================================================
--  卒業研究アプリ：データベース「sotsuken」
--
--  入れ方（どちらか）
--    ・ターミナル : cd ~/projects/tauri-app && mariadb < db/sotsuken.sql
--    ・ダッシュボード : 「データベース」→「取り込む」でこのファイルを選ぶ
--
--  テーブル（ER 図どおり）
--    user           … アカウント（ログイン ID = user_id、パスワードは暗号化して保存）
--    gender         … 性別の一覧
--    language       … プログラム言語・試験の一覧（どちらも同じ一覧に入れる）
--    user_language  … だれが、どの言語・試験を登録しているか
--
--  何度流しても大丈夫です（すでにあるテーブル・データはそのまま）。
-- ============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `sotsuken` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `sotsuken`;

-- 性別
CREATE TABLE IF NOT EXISTS `gender` (
  `gender_id`   INTEGER(3)  NOT NULL,
  `gender_name` VARCHAR(16) NOT NULL,
  PRIMARY KEY (`gender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- プログラム言語・試験
CREATE TABLE IF NOT EXISTS `language` (
  `language_id`   VARCHAR(16)  NOT NULL,
  `language_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- アカウント
CREATE TABLE IF NOT EXISTS `user` (
  `user_id`    VARCHAR(16)  NOT NULL COMMENT 'ログイン ID',
  `name`       VARCHAR(255) NOT NULL,
  `password`   VARCHAR(255) NOT NULL COMMENT '暗号化（Argon2）したパスワード',
  `mail`       VARCHAR(255) NOT NULL,
  `gender_id`  INTEGER(3)   NOT NULL,
  `birth_date` DATE         NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_mail` (`mail`),
  CONSTRAINT `fk_user_gender` FOREIGN KEY (`gender_id`) REFERENCES `gender` (`gender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- だれが、どの言語・試験を登録しているか
CREATE TABLE IF NOT EXISTS `user_language` (
  `user_language_id` VARCHAR(16) NOT NULL,
  `user_id`          VARCHAR(16) NOT NULL,
  `language_id`      VARCHAR(16) NOT NULL,
  PRIMARY KEY (`user_language_id`),
  CONSTRAINT `fk_ul_user`     FOREIGN KEY (`user_id`)     REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ul_language` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ───────── 初期データ（すでにあるものは入れない） ─────────
INSERT IGNORE INTO `gender` (`gender_id`, `gender_name`) VALUES
  (1, '男性'),
  (2, '女性'),
  (3, 'その他'),
  (9, '回答しない');

-- プログラム言語・試験（同じ一覧）
INSERT IGNORE INTO `language` (`language_id`, `language_name`) VALUES
  ('c',           'C'),
  ('cpp',         'C++'),
  ('csharp',      'C#'),
  ('java',        'Java'),
  ('python',      'Python'),
  ('javascript',  'JavaScript'),
  ('typescript',  'TypeScript'),
  ('php',         'PHP'),
  ('ruby',        'Ruby'),
  ('go',          'Go'),
  ('rust',        'Rust'),
  ('kotlin',      'Kotlin'),
  ('swift',       'Swift'),
  ('sql',         'SQL'),
  ('html_css',    'HTML / CSS'),
  ('ip',          'ITパスポート試験'),
  ('sg',          '情報セキュリティマネジメント試験'),
  ('fe',          '基本情報技術者試験'),
  ('ap',          '応用情報技術者試験'),
  ('db',          'データベーススペシャリスト試験'),
  ('nw',          'ネットワークスペシャリスト試験'),
  ('java_silver', 'Oracle Certified Java Programmer Silver'),
  ('py_basic',    'Python 3 エンジニア認定基礎試験'),
  ('lpic1',       'LPIC-1'),
  ('ccna',        'CCNA');
