import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoard,createPiece} from '../models.js';
import {createPixelTheme} from '../pixel-theme.js';

test('Pixel theme restores shared geometry and materials after repeated switches',()=>{
 const board=createBoard(),piece={model:createPiece('knight','black'),color:'black',active:true};
 const mesh=piece.model.children[0],original=mesh.material,geometry=mesh.geometry,materials=piece.model.userData.materials;
 for(let i=0;i<3;i++){
  const theme=createPixelTheme(board,[piece]);
  assert.equal(mesh.geometry,geometry);assert.notEqual(mesh.material,original);
  theme.update(.2,piece,false);assert.ok(mesh.material.uniforms.highlight.value>.5);
  theme.update(1,null,false);assert.ok(mesh.material.uniforms.highlight.value<.01);
  theme.dispose();assert.equal(mesh.material,original);assert.equal(mesh.children.length,0);assert.equal(piece.model.userData.materials,materials);
 }
});
