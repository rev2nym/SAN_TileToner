//=============================================================================
// SAN_TileToner.js
//=============================================================================
// Copyright (c) 2016-2017 Sanshiro
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc タイルトナー 1.1.6
 * マップのタイルを染色します。
 * @author サンシロ https://twitter.com/rev2nym
 * @version 1.1.6 2017/12/11 表示位置のズレを修正。
 * 1.1.5 2017/06/12 コアスクリプト ver1.5.0 対応。
 * 1.1.4 2017/05/13 コミュニティ版コアスクリプト対応。クラス定義をグローバル化。
 * 1.1.3 2017/01/24 タイルの継ぎ目が滑らかになるよう下地の大きさを調整。
 * 1.1.2 2016/12/28 消去されるべきスプライトが残る不具合を修正。
 * 1.1.1 2016/12/19 リファクタリング。
 * 1.1.0 2016/12/19 タイル染色の下地の表示機能の追加。フェード機能の追加。
 * 1.0.0 2016/12/19 正規版公開。
 * 
 * @param ShowBaseTone
 * @desc タイル染色の下地の表示有効化スイッチです。
 * 'ON'で有効化します。
 * @default ON
 * 
 * @param FadingDuration
 * @desc フェード完了までにかかるフレーム数です。
 * @default 15
 * 
 * @help
 * ■概要
 * スクリプトコマンドによってマップのタイルを染色します。
 * 染色したタイルには波紋のようなアニメーションを表示します。
 * RGBとアルファ値の設定が可能です。
 * 
 * ■タイル染色の設定
 * タイルを染色するには以下のスクリプトコマンドを実行してください。
 * 
 *   $gameMap.setTileTone(x, y, r, g, b, alpha)
 *     x     : タイルX座標です。
 *     y     : タイルY座標です。
 *     r     : R成分です。0～255が有効です。
 *     g     : G成分です。0～255が有効です。
 *     b     : B成分です。0～255が有効です。
 *     alpha : アルファ値です。0～255が有効です。
 * 
 * ■指定タイルの染色のクリア
 * タイルの染色をクリアするには以下のスクリプトコマンドを実行してください。
 * 
 *   $gameMap.removeTileTone(x, y)
 *     x     : タイルX座標です。
 *     y     : タイルY座標です。
 * 
 * ■全タイルの染色のクリア
 * 全てのタイルの染色をクリアするには以下のスクリプトコマンドを実行してください。
 * 
 *   $gameMap.clearTileTones()
 * 
 * ■利用規約
 * MITライセンスのもと、商用利用、改変、再配布が可能です。
 * ただし冒頭のコメントは削除や改変をしないでください。
 * 
 * これを利用したことによるいかなる損害にも作者は責任を負いません。
 * サポートは期待しないでください＞＜。
 */

var Imported = Imported || {};
Imported.SAN_TileToner = true;

var Sanshiro = Sanshiro || {};
Sanshiro.TileToner = Sanshiro.TileToner || {};
Sanshiro.TileToner.version = '1.1.6';

(function() {
'use strict';

// プラグインパラメータ
var _pluginParameters = PluginManager.parameters('SAN_TileToner');

//-----------------------------------------------------------------------------
// ImageManager
//
// イメージマネージャー

// キャッシュからのビットマップの取得
ImageManager.getBitmapFromCache = function(key) {
    return (!!this._imageCache ?
        this._imageCache.get(key) :
        this.cache.getItem(key)
    );
};

// キャッシュへのビットマップの追加
ImageManager.addBitmapToCache = function(key, value) {
    return (!!this._imageCache ?
        this._imageCache.add(key, value) :
        this.cache.setItem(key, value)
    );
};

//-----------------------------------------------------------------------------
// TileTone
//
// タイルトーン

function TileTone() {
    this.initialize.apply(this, arguments);
}

// オブジェクト初期化
TileTone.prototype.initialize = function(x, y, r, g, b, alpha) {
    this.initMembers(x, y, r, g, b, alpha);
};

// メンバ変数の初期化
TileTone.prototype.initMembers = function(x, y, r, g, b, alpha) {
    this._x = x;
    this._y = y;
    this._r = r;
    this._g = g;
    this._b = b;
    this._gray = (r + g + b) / 3.0;
    this._alpha = (alpha !== undefined ? alpha : 1.0);
};

// X座標
TileTone.prototype.x = function() {
    return this._x;
};

// Y座標
TileTone.prototype.y = function() {
    return this._y;
};

// トーン
TileTone.prototype.tone = function() {
    return [this._r, this._g, this._b, this._gray];
};

// アルファ
TileTone.prototype.alpha = function() {
    return this._alpha;
};

//-----------------------------------------------------------------------------
// Game_Map
//
// マップ

// オブジェクト初期化
var _Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
    _Game_Map_initialize.call(this);
    this.initTileTones();
};

// タイルトーンの初期化
Game_Map.prototype.initTileTones = function() {
    this._tileTones = [];
};

// タイルトーンのクリア
Game_Map.prototype.clearTileTones = function() {
    this._tileTones = [];
};

// タイルトーンリスト
Game_Map.prototype.tileTones = function() {
    return this._tileTones;
};

// タイルトーンの設定
Game_Map.prototype.setTileTone = function(x, y, r, g, b, alpha) {
    this.removeTileTone(x, y);
    var tileTone = new TileTone(x, y, r, g, b, alpha);
    this._tileTones.push(tileTone);
};

// タイルトーン
Game_Map.prototype.tileTone = function(x, y) {
    for (var i = 0; i < this._tileTones.length; i++) {
        var tileTone = this._tileTones[i];
        if (tileTone.x() === x && tileTone.y() === y) {
            return tileTone;
        }
    }
};

// タイルトーンの除去
Game_Map.prototype.removeTileTone = function(x, y) {
    var index = this._tileTones.indexOf(this.tileTone(x, y));
    if (index !== -1) {
        this._tileTones.splice(index, 1);
    }
};

//-----------------------------------------------------------------------------
// Spriteset_Map
//
// マップスプライトセット

var _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
Spriteset_Map.prototype.createLowerLayer = function() {
    _Spriteset_Map_createLowerLayer.call(this);
    this.createTileTones();
};

// タイルトーンスプライトリストの生成
Spriteset_Map.prototype.createTileTones = function() {
    this._tileToneSprites = [];
};

// フレーム更新
var _Spriteset_Map_update = Spriteset_Map.prototype.update;
Spriteset_Map.prototype.update = function() {
    _Spriteset_Map_update.call(this);
    this.updateTileTones();
};

// タイルトーンリストの更新
Spriteset_Map.prototype.updateTileTones = function() {
    this.fadeOutRemovedTileToneSprites();
    this.removefadedOutTileToneSprites();
    this.addAddedTileToneSprites();
    Sprite_TileTone.updateAnimation();
};

// タイルトーンスプライトの追加
Spriteset_Map.prototype.addTileToneSprite = function(tileToneSprite) {
    this._tileToneSprites.push(tileToneSprite);
    this._tilemap.addChild(tileToneSprite);
};

// タイルトーンスプライトのフェードアウト
Spriteset_Map.prototype.fadeOutTileToneSprite = function(tileToneSprite) {
    tileToneSprite.fadeOut();
};

// タイルトーンスプライトの除去
Spriteset_Map.prototype.removeTileToneSprite = function(tileToneSprite) {
    var index = this._tileToneSprites.indexOf(tileToneSprite);
    if (index !== -1) {
        this._tileToneSprites.splice(index, 1);
    }
    this._tilemap.removeChild(tileToneSprite);
};

// 除去タイルトーンスプライトリストのフェードアウト
Spriteset_Map.prototype.fadeOutRemovedTileToneSprites = function() {
    var removedTileToneSprites = this.removedTileToneSprites();
    removedTileToneSprites.forEach(function(removedTileToneSprite) {
        this.fadeOutTileToneSprite(removedTileToneSprite);
    }, this);
};

// フェードアウト完了タイルトーンスプライトリストの除去
Spriteset_Map.prototype.removefadedOutTileToneSprites = function() {
    var fadedOutTileToneSprites = this.fadedOutTileToneSprites();
    fadedOutTileToneSprites.forEach(function(fadedOutTileToneSprite) {
        this.removeTileToneSprite(fadedOutTileToneSprite);
    }, this);
};

// フェードアウト完了タイルトーンスプライトリスト
Spriteset_Map.prototype.fadedOutTileToneSprites = function() {
    var fadedOutTileToneSprites = this._tileToneSprites.filter(
        function(tileToneSprite) {
            return tileToneSprite.isFadedOut();
        }
    );
    return fadedOutTileToneSprites;
};

// 追加タイルトーンスプライトリストの追加
Spriteset_Map.prototype.addAddedTileToneSprites = function() {
    var addedTileToneSprites = this.addedTileToneSprites();
    addedTileToneSprites.forEach(function(addedTileToneSprite) {
        this.addTileToneSprite(addedTileToneSprite);
    }, this);
};

// 追加タイルトーンスプライトリスト
Spriteset_Map.prototype.addedTileToneSprites = function() {
    var addedTileTones = this.addedTileTones();
    var addedTileToneSprites = addedTileTones.map(function(addedTileTone) {
        return new Sprite_TileTone(addedTileTone, this._tilemap);
    }, this);
    return addedTileToneSprites;
};

// 追加タイルトーンリスト
Spriteset_Map.prototype.addedTileTones = function() {
    var tileTones = this.tileTones();
    var addedTileTones = $gameMap.tileTones().filter(function(tileTone) {
        return tileTones.indexOf(tileTone) === -1;
    }, this);
    return addedTileTones;
};

// 除去タイルトーンスプライトリスト
Spriteset_Map.prototype.removedTileToneSprites = function() {
    var removedTileTones = this.removedTileTones();
    var removedTileToneSprites = this._tileToneSprites.filter(
        function(tileToneSprite) {
            return removedTileTones.indexOf(tileToneSprite.tileTone()) !== -1;
        }
    );
    return removedTileToneSprites;
};

// 除去タイルトーンリスト
Spriteset_Map.prototype.removedTileTones = function() {
    var tileTones = this.tileTones();
    var removedTileTones = tileTones.filter(function(tileTone) {
        return $gameMap.tileTones().indexOf(tileTone) === -1;
    });
    return removedTileTones;
};

// タイルトーンリスト
Spriteset_Map.prototype.tileTones = function() {
    var tileTones = this._tileToneSprites.map(function(tileToneSprite) {
        return tileToneSprite.tileTone();
    });
    return tileTones;
};

//-----------------------------------------------------------------------------
// Sprite_TileTone
//
// タイルトーンスプライト

function Sprite_TileTone() {
    this.initialize.apply(this, arguments);
}

// アニメーションカウント
Sprite_TileTone._animationCount = 0;

// アニメーションの更新
Sprite_TileTone.updateAnimation = function() {
    this._animationCount++;
};

// アニメーションカウント
Sprite_TileTone.animationCount = function() {
    return this._animationCount;
};

Sprite_TileTone.prototype = Object.create(Sprite.prototype);
Sprite_TileTone.prototype.constructor = Sprite_TileTone;

// オブジェクト初期化
Sprite_TileTone.prototype.initialize = function(tileTone, tileMap) {
    this._tileMap = tileMap;
    Sprite.prototype.initialize.call(this);
    this.initMembers(tileTone);
};

// メンバー変数の初期化
Sprite_TileTone.prototype.initMembers = function(tileTone) {
    this._tileTone = tileTone;
    this.visible = true;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.initBitmap();
    this.initPosition();
    this.initFading();
    this.initOpacity();
    this.initLowerSprite();
    this.initUpperSprite();
};

// ビットマップの初期化
Sprite_TileTone.prototype.initBitmap = function() {
    if (this.showBaseTone()) {
        this.bitmap = this.createBitmap();
    } else {
        this.setFrame(0, 0, this.toneWidth(), this.toneHeight());
    }
};

// 座標の初期化
Sprite_TileTone.prototype.initPosition = function() {
    this.setPosition(this.tileTone().x(), this.tileTone().y(), 0.5);
};

// フェードの初期化
Sprite_TileTone.prototype.initFading = function() {
    this._fadingState = 'fadingIn';
    this._fadingDuration = this.defaultFadingDuration();
    this._fadingCount = 0;
};

// 不透明度の初期化
Sprite_TileTone.prototype.initOpacity = function() {
    this.opacity = 0;
};

// 下層スプライトの初期化
Sprite_TileTone.prototype.initLowerSprite = function() {
    this._lowerSprite = new Sprite_LowerTileTone(this);
    this.addChild(this._lowerSprite);
};

// 上層スプライトの初期化
Sprite_TileTone.prototype.initUpperSprite = function() {
    this._upperSprite = new Sprite_UpperTileTone(this);
    this.addChild(this._upperSprite);
};

// 座標の設定
Sprite_TileTone.prototype.setPosition = function(x, y, z) {
    this.x = ($gameMap.adjustX(x) + this.anchor.x) * $gameMap.tileWidth();
    this.y = ($gameMap.adjustY(y) + this.anchor.y) * $gameMap.tileHeight();
    this.z = (z === undefined ? this.z : z);
};

// ベース表示有効判定
Sprite_TileTone.prototype.showBaseTone = function() {
    return _pluginParameters['ShowBaseTone'] === 'ON';
};

// フェード継続フレーム数初期値
Sprite_TileTone.prototype.defaultFadingDuration = function() {
    var duration = Math.max(1, Number(_pluginParameters['FadingDuration']));
    return duration;
};

// 画像キャッシュキー
Sprite_TileTone.prototype.imageCacheKey = function() {
    return 'TileToneBase';
};

// トーンの幅
Sprite_TileTone.prototype.toneWidth = function() {
    return $gameMap.tileWidth() + 2;
};

// トーンの高さ
Sprite_TileTone.prototype.toneHeight = function() {
    return $gameMap.tileHeight() + 2;
};

// ベースカラー
Sprite_TileTone.prototype.baseColor = function() {
    return 'white';
};

// ベース不透明度
Sprite_TileTone.prototype.baseOpacity = function() {
    return this.tileTone().alpha();
};

// 不透明度率
Sprite_TileTone.prototype.opacityRate = function() {
    return this._fadingCount / this._fadingDuration;
};

// タイルトーン
Sprite_TileTone.prototype.tileTone = function() {
    return this._tileTone;
};

// フレーム更新
Sprite_TileTone.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updatePosition();
    this.updateFading();
    this.updateOpacity();
};

// 座標の更新
Sprite_TileTone.prototype.updatePosition = function() {
    this.setPosition(this.tileTone().x(), this.tileTone().y(), 0.5);
};

// フェードの更新
Sprite_TileTone.prototype.updateFading = function() {
    if (this._fadingState === 'fadingIn') {
        this.updateFadingIn();
    } else if (this._fadingState === 'fadingOut') {
        this.updateFadingOut();
    }
};

// フェードインの更新
Sprite_TileTone.prototype.updateFadingIn = function() {
    this._fadingCount = Math.min(this._fadingCount + 1, this._fadingDuration);
    if (this._fadingCount === this._fadingDuration) {
        this._fadingState = 'fadedIn';
    }
};

// フェードアウトの更新
Sprite_TileTone.prototype.updateFadingOut = function() {
    this._fadingCount = Math.max(0, this._fadingCount - 1);
    if (this._fadingCount === 0) {
        this._fadingState = 'fadedOut';
    }
};

// 不透明度の更新
Sprite_TileTone.prototype.updateOpacity = function() {
    this.opacity = this.baseOpacity() * this.opacityRate();
};

// フェードイン
Sprite_TileTone.prototype.fadeIn = function() {
    if (this._fadingState === 'fadingOut' ||
        this._fadingState === 'fadedOut') 
    {
        this._fadingState = 'fadingIn';
    }
};

// フェードアウト
Sprite_TileTone.prototype.fadeOut = function() {
    if (this._fadingState === 'fadingIn' ||
        this._fadingState === 'fadedIn') 
    {
        this._fadingState = 'fadingOut';
    }
};

// フェードアウト完了判定
Sprite_TileTone.prototype.isFadedOut = function() {
    return this._fadingState === 'fadedOut';
};

// ビットマップの生成
Sprite_TileTone.prototype.createBitmap = function() {
    var bitmap = ImageManager.getBitmapFromCache(this.imageCacheKey());
    if (!bitmap) {
        bitmap = new Bitmap(this.toneWidth(), this.toneHeight());
        bitmap.fillAll(this.baseColor());
        ImageManager.addBitmapToCache(this.imageCacheKey(), bitmap);
    }
    return bitmap;
};

//-----------------------------------------------------------------------------
// Sprite_LowerTileTone
//
// 下層タイルトーンスプライト

function Sprite_LowerTileTone() {
    this.initialize.apply(this, arguments);
}

Sprite_LowerTileTone.prototype = Object.create(Sprite.prototype);
Sprite_LowerTileTone.prototype.constructor = Sprite_LowerTileTone;

// オブジェクト初期化
Sprite_LowerTileTone.prototype.initialize = function(baseSprite) {
    Sprite.prototype.initialize.call(this);
    this.initMembers(baseSprite);
};

// メンバー変数の初期化
Sprite_LowerTileTone.prototype.initMembers = function(baseSprite) {
    this._baseSprite = baseSprite;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.initBitmap();
    this.initToneColor();
    this.initPosition();
    this.initOpacity();
};

// ビットマップの初期化
Sprite_LowerTileTone.prototype.initBitmap = function() {
    this.bitmap = this.createBitmap();
};

// トーンカラーの初期化
Sprite_LowerTileTone.prototype.initToneColor = function() {
    this.setColorTone(this.tileTone().tone());
};

// 座標の初期化
Sprite_LowerTileTone.prototype.initPosition = function(x, y) {
    this.setPosition(0, 0, 0);
};

// 不透明度の初期化
Sprite_LowerTileTone.prototype.initOpacity = function(x, y) {
    this.opacity = this.baseOpacity();
};

// 画像キャッシュキー
Sprite_LowerTileTone.prototype.imageCacheKey = function() {
    return 'TileToneLower';
};

// トーンの幅
Sprite_LowerTileTone.prototype.toneWidth = function() {
    return $gameMap.tileWidth() - 2;
};

// トーンの高さ
Sprite_LowerTileTone.prototype.toneHeight = function() {
    return $gameMap.tileHeight() - 2;
};

// ベースカラー
Sprite_LowerTileTone.prototype.baseColor = function() {
    return 'black';
};

// ベース不透明度
Sprite_LowerTileTone.prototype.baseOpacity = function() {
    return 255 * (2.0 / 3.0);
};

// タイルトーン
Sprite_LowerTileTone.prototype.tileTone = function() {
    return this._baseSprite.tileTone();
};

// 座標の設定
Sprite_LowerTileTone.prototype.setPosition = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = (z === undefined ? this.z : z);
};

// フレーム更新
Sprite_LowerTileTone.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateToneColor();
    this.updateOpacity();
    this.updatePosition();
};

// 座標の更新
Sprite_LowerTileTone.prototype.updatePosition = function() {
    this.setPosition(0, 0);
};

// 不透明度の更新
Sprite_LowerTileTone.prototype.updateOpacity = function() {
    this.opacity = this.baseOpacity();
};

// トーンカラーの更新
Sprite_LowerTileTone.prototype.updateToneColor = function() {
    this.setColorTone(this.tileTone().tone());
};

// ビットマップの生成
Sprite_LowerTileTone.prototype.createBitmap = function() {
    return Sprite_TileTone.prototype.createBitmap.call(this);
};

//-----------------------------------------------------------------------------
// Sprite_UpperTileTone
//
// 上層タイルトーンスプライト

function Sprite_UpperTileTone() {
    this.initialize.apply(this, arguments);
}

Sprite_UpperTileTone.prototype = Object.create(Sprite_LowerTileTone.prototype);
Sprite_UpperTileTone.prototype.constructor = Sprite_UpperTileTone;

// アニメーション周期
Sprite_UpperTileTone.prototype.animationPeriod = function() {
    return 90;
};

// メンバー変数の初期化
Sprite_UpperTileTone.prototype.initMembers = function(baseSprite) {
    Sprite_LowerTileTone.prototype.initMembers.call(this, baseSprite);
    this.initScale();
};

// 不透明度の初期化
Sprite_UpperTileTone.prototype.initOpacity = function(x, y) {
    this.opacity = this.baseOpacity() * this.opacityRate();
};

// スケールの更新
Sprite_UpperTileTone.prototype.initScale = function() {
    this.scale.x = this.scaleRate();
    this.scale.y = this.scaleRate();
};

// 画像キャッシュキー
Sprite_UpperTileTone.prototype.imageCacheKey = function() {
    return 'TileToneUpper';
};

// ベース不透明度
Sprite_UpperTileTone.prototype.baseOpacity = function() {
    return 255 * (1.0 / 3.0);
};

// 不透明度率
Sprite_UpperTileTone.prototype.opacityRate = function() {
    return 1.0 - Math.min(1.0, this.animationRate() * 3.0);
};

// スケール率
Sprite_UpperTileTone.prototype.scaleRate = function() {
    return Math.min(1.0, this.animationRate() * 4.0);
};

// アニメーション進行率
Sprite_UpperTileTone.prototype.animationRate = function() {
    return (
        (Sprite_TileTone.animationCount() % this.animationPeriod()) /
        this.animationPeriod()
    );
};

// フレーム更新
Sprite_UpperTileTone.prototype.update = function() {
    Sprite_LowerTileTone.prototype.update.call(this);
    this.updateScale();
};

// 不透明度の更新
Sprite_UpperTileTone.prototype.updateOpacity = function() {
    this.opacity = this.baseOpacity() * this.opacityRate();
};

// スケールの更新
Sprite_UpperTileTone.prototype.updateScale = function() {
    this.scale.x = this.scaleRate();
    this.scale.y = this.scaleRate();
};

//-----------------------------------------------------------------------------
// クラスのグローバル登録

window.TileTone = TileTone;
window.Sprite_TileTone = Sprite_TileTone;
window.Sprite_LowerTileTone = Sprite_LowerTileTone;
window.Sprite_UpperTileTone = Sprite_UpperTileTone;

})();
