import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createBoard,createPiece} from '../models.js';
import {createWaterTheme} from '../water-theme.js';
test('Water ripples react to input and restore subdivided board geometry',()=>{
 const board=createBoard(),piece={model:createPiece('pawn','white'),color:'white',active:true},mesh=board.children[0],geometry=mesh.geometry,material=mesh.material;
 const theme=createWaterTheme(board,[piece]);assert.notEqual(mesh.geometry,geometry);
 theme.point(new THREE.Vector3(1,0,2));theme.splash(new THREE.Vector3(1,0,2));theme.update(.1,false);
 assert.equal(mesh.material.uniforms.interactivePiece.value,0);assert.equal(piece.model.children[0].material.uniforms.interactivePiece.value,1);
 const u=mesh.material.uniforms;assert.ok(u.pointerStrength.value>0);assert.equal(u.ripples.value[0].x,1);assert.equal(u.ripples.value[0].y,2);assert.equal(u.ripples.value[0].w,1);
 theme.update(.1,false,piece);assert.ok(u.hoverBoost.value>0);assert.equal(u.ripples.value.filter(r=>r.w>0).length,1,'hover morphs without emitting additional rings');
 theme.update(.1,true);assert.equal(u.motion.value,0);
 theme.dispose();assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
});
