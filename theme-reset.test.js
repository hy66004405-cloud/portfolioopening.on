import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoard,createPiece} from '../models.js';
import {createSketchTheme} from '../sketch-theme.js';
import {createWaterTheme} from '../water-theme.js';
import {createPixelTheme} from '../pixel-theme.js';
import {restoreSceneOpacity} from '../scene-visibility.js';

for(const [name,createTheme] of [['sketchbook',createSketchTheme],['Pixel',createPixelTheme],['Water',createWaterTheme]]){
 test(`${name}: opening reset restores board and every piece after collection fade`,()=>{
  const board=createBoard();
  const pieces=[{model:createPiece('knight','black'),type:'knight',color:'black',active:true},{model:createPiece('pawn','white'),type:'pawn',color:'white',active:false}];
  const original=board.children[0].material;
  for(let repeat=0;repeat<3;repeat++){
   // Knight collection hides the board before applying a replacement theme.
   restoreSceneOpacity(board,pieces,0,pieces[0]);
   const theme=createTheme(board,pieces);
   restoreSceneOpacity(board,pieces,1);
   theme.dispose();
   assert.equal(board.children[0].material,original);
   assert.equal(original.opacity,0,'reproduces stale original material opacity');
   restoreSceneOpacity(board,pieces,1);
   for(const group of [board,...pieces.map(p=>p.model)]){
    assert.equal(group.visible,true);
    for(const material of group.userData.materials){assert.equal(material.opacity,1);assert.equal(material.depthWrite,true);}
   }
  }
 });
}
