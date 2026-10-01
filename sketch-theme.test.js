import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoard,createPiece} from '../models.js';
import {createSketchTheme} from '../sketch-theme.js';

test('Sketch theme redraw restarts on entry and settles without repeating while hovered',()=>{
 const board=createBoard(),piece={model:createPiece('knight','black'),color:'black',active:true};
 const theme=createSketchTheme(board,[piece]);
 const progress=piece.model.children[0].material.uniforms.progress;
 theme.update(.016,piece,false);assert.ok(progress.value<0);
 theme.update(3,piece,false);assert.equal(progress.value,1);
 theme.update(.016,piece,false);assert.equal(progress.value,1);
 theme.update(.016,null,false);theme.update(.016,piece,false);assert.ok(progress.value<0);
 theme.update(.016,piece,true);assert.equal(progress.value,1);
 theme.dispose();
});

test('Sketch theme restores original geometry and materials through repeated switches',()=>{
 const board=createBoard(),piece={model:createPiece('pawn','white'),color:'white',active:true};
 const mesh=piece.model.children[0],original=mesh.material,geometry=mesh.geometry;
 const materials=piece.model.userData.materials;
 const boardCount=board.children.length;
 for(let i=0;i<3;i++){
  const theme=createSketchTheme(board,[piece]);
  assert.notEqual(mesh.material,original);assert.equal(mesh.geometry,geometry);
  assert.equal(mesh.children.length,2);
  theme.dispose();
  assert.equal(mesh.material,original);assert.equal(mesh.geometry,geometry);
  assert.equal(mesh.children.length,0);assert.equal(piece.model.userData.materials,materials);
  assert.equal(board.children.length,boardCount);
 }
});
