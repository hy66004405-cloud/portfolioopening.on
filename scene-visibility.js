export function setGroupOpacity(group,value){
 group.visible=value>.003;
 group.userData.materials.forEach(material=>{
  material.opacity=value;
  material.depthWrite=material.userData.wireLine?false:material.userData.wireDepth?true:value>.98;
 });
}

// Restored source materials may still carry the opacity from entering a collection.
// Reconcile the whole scene after swapping a theme's materials back to originals.
export function restoreSceneOpacity(board,pieces,fade,selected=null){
 setGroupOpacity(board,fade);
 for(const piece of pieces)setGroupOpacity(piece.model,piece===selected?1:fade);
}
