import { designProjects } from './design-projects.js?v=25';
import { tasteImages } from './taste-images.js';
export const categories={
 design:{title:'School project',line:'School<br>project.',kicker:'01 / THE PAWN',description:'포스터, 드로잉, 시각 원리. 작업의 결과와 그 뒤의 과정을 살펴봅니다.',piece:'PAWN',items:designProjects},
 taste:{title:'Taste archive',line:'Taste<br>archive.',kicker:'02 / THE BISHOP',description:'형태, 색, 그리고 시선. 그래픽 디자인 보드에서 모은 18개의 장면.',piece:'BISHOP',items:tasteImages},
 experiment:{title:'Experiment',line:'Experi<br>ment.',kicker:'03 / THE KNIGHT',description:'정해진 경로에서 한 걸음 옆으로. 움직임과 형태, 디지털 재료의 가능성을 실험합니다.',piece:'KNIGHT',items:[
  {title:'001 / Soft oscillation',tag:'MOTION / RHYTHM',art:'<div class="motion-shapes"><i></i><i></i><i></i><i></i></div>',cls:'art-dark',description:'위상이 서로 다른 움직임을 겹쳐 자연스러운 리듬을 만드는 모션 스터디입니다.',role:'Motion design · Creative coding',process:'시간차 설정 → 진폭 조절 → 반복 리듬'},
  {title:'002 / Matter & light',tag:'3D / MATERIAL STUDY',art:'<div class="orb-study"></div>',cls:'',description:'하나의 구체에 빛의 위치와 명암을 달리해 부피의 인상이 어떻게 바뀌는지 탐구하는 시각 연구입니다.',role:'Lighting study · Shading',process:'기본 형태 → 광원 배치 → 명암 조절'},
  {title:'003 / A different opening',tag:'INTERACTION / SPATIAL DESIGN',art:'<div class="grid-study"></div>',cls:'',description:'체스의 전개를 웹사이트의 탐색 방식으로 옮긴 공간 인터랙션 실험입니다. 선택, 집중, 진입의 세 단계를 연결합니다.',role:'Interaction design · 3D development',process:'체스 좌표 → 카메라 전환 → 공간 탐색'}]}
};
