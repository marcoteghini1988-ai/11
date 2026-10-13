/** Gatling Cinetica: temporary holographic weapon. Visual-only; no damage rules here. */
import * as THREE from 'three';
import { playSound } from './audio';

function findSource(weapon, enemy) {
  const slots = [...document.querySelectorAll(enemy ? '[data-enemy-weapon-slot]' : '[data-player-weapon-slot]')];
  const suit = weapon?.suit;
  return slots.find(el => suit && el.dataset.suit === String(suit)) || slots.find(el => el.id === `${enemy ? 'ai_' : ''}weapon_box_${suit}`) || slots[0] || null;
}

export function projectGatlingHologram(weapon, level, {targetDockId, targetX, targetY, isEnemyAttacking = false, onComplete}) {
  if (typeof document === 'undefined') return onComplete?.();
  const source = findSource(weapon, isEnemyAttacking);
  const rect = source?.getBoundingClientRect();
  const originX = rect ? rect.left + rect.width / 2 : innerWidth / 2;
  const originY = rect ? rect.top + rect.height / 2 : (isEnemyAttacking ? innerHeight * .22 : innerHeight * .78);
  const target = document.getElementById(targetDockId);
  const tr = target?.getBoundingClientRect();
  const tx = Number.isFinite(targetX) ? targetX : (tr ? tr.left + tr.width / 2 : innerWidth / 2);
  const ty = Number.isFinite(targetY) ? targetY : (tr ? tr.top + tr.height / 2 : innerHeight / 2);
  const hue = isEnemyAttacking ? '#ff718b' : '#49e5ff';
  const width = Math.min(260, Math.max(160, innerWidth * .49));
  const height = width * .94;
  const left = Math.max(0, Math.min(innerWidth - width, originX - width / 2));
  // Project toward the center of the board, without hiding the source card.
  const top = Math.max(10, Math.min(innerHeight - height - 8, originY + (isEnemyAttacking ? 8 : -height + 5)));
  const host = document.createElement('div');
  host.className = 'gatling-holo-host';
  host.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;--holo:${hue}`;
  host.innerHTML = '<div class="gatling-holo-scan"></div><div class="gatling-holo-platform"></div><div class="gatling-holo-caption">PROIEZIONE TATTICA</div>';
  document.body.appendChild(host);
  source?.classList.add('gatling-holo-source');
  let renderer, scene, camera, weaponGroup, rotor, recoil, glow;
  let frame = 0, done = false, fired = 0;
  const bullets = [];
  const start = performance.now();
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    bullets.forEach(el => el.remove());
    source?.classList.remove('gatling-holo-source');
    if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
    host.remove();
    onComplete?.();
  };
  try {
    renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width,height);
    renderer.setClearColor(0x000000,0);
    renderer.domElement.className='gatling-holo-canvas';
    host.appendChild(renderer.domElement);
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(38,width/height,.1,50);
    camera.position.set(5.2,3.4,8.8);
    camera.lookAt(0,1.25,0);
    scene.add(new THREE.AmbientLight(0x72d8ff,1.3));
    const key=new THREE.PointLight(isEnemyAttacking?0xff6c91:0x3eeaff,35,15);
    key.position.set(-3,6,5); scene.add(key);
    const metallic=new THREE.MeshStandardMaterial({color:0x4c7c97,metalness:.72,roughness:.32,transparent:true,opacity:.85,emissive:0x12517a,emissiveIntensity:.35});
    const dark=new THREE.MeshStandardMaterial({color:0x19384d,metalness:.75,roughness:.32,transparent:true,opacity:.88});
    const light=new THREE.MeshStandardMaterial({color:isEnemyAttacking?0xff4e79:0x32dcff,metalness:.35,roughness:.18,emissive:isEnemyAttacking?0xff315e:0x00cfff,emissiveIntensity:1.5,transparent:true,opacity:.92});
    const add=(group,geometry,material,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
    weaponGroup=new THREE.Group();scene.add(weaponGroup);
    const base=add(weaponGroup,new THREE.CylinderGeometry(1.15,1.35,.32,10),dark,0,.17,0);
    add(weaponGroup,new THREE.CylinderGeometry(.94,1.04,.13,12),light,0,.36,0);
    for (let i=0;i<6;i++) {const a=i*Math.PI/3;add(weaponGroup,new THREE.BoxGeometry(.28,.25,.42),metallic,Math.cos(a)*1.05,.34,Math.sin(a)*1.05);}
    add(weaponGroup,new THREE.CylinderGeometry(.48,.58,.78,12),metallic,0,.84,0);
    const turret=new THREE.Group();turret.position.y=1.36;weaponGroup.add(turret);
    add(turret,new THREE.BoxGeometry(1.72,.82,1.52),metallic,0,0,0);
    add(turret,new THREE.BoxGeometry(1.2,.34,1.66),dark,0,.44,-.02);
    for (let i=0;i<Math.min(4,level);i++) {
      add(turret,new THREE.BoxGeometry(.18,.22,.7),light,-.55+i*.36,.6,0);
    }
    rotor=new THREE.Group();rotor.position.set(0,-.05,.66);turret.add(rotor);
    const count=level>=4?8:level>=3?6:level>=2?5:4;
    const barrelLength=1.95 + .14*Math.min(level,4);
    for(let i=0;i<count;i++){
      const a=i*2*Math.PI/count;
      const x=Math.cos(a)*.27,y=Math.sin(a)*.27;
      const barrel=add(rotor,new THREE.CylinderGeometry(.085,.10,barrelLength,9),metallic,x,y,barrelLength/2);
      barrel.rotation.x=Math.PI/2;
      add(rotor,new THREE.TorusGeometry(.11,.04,6,12),light,x,y,barrelLength);
    }
    add(rotor,new THREE.CylinderGeometry(.37,.37,.32,12),dark,0,0,.15).rotation.x=Math.PI/2;
    glow=add(rotor,new THREE.SphereGeometry(.18,12,8),light,0,0,barrelLength+.1);
    glow.visible=false;
    // Keep the hologram facing the opposing HP dock. Both teams use the same source/target logic.
    const aimX=Math.max(-.35,Math.min(.35,(tx-originX)/innerWidth));
    turret.rotation.y=aimX;
    const platform=add(scene,new THREE.TorusGeometry(1.48,.04,8,60),light,0,.02,0);platform.rotation.x=Math.PI/2;
    let lastShot=0;
    const shot=(time)=>{
      try { playSound('plasma_damage'); } catch(_) {}
      const muzzle=new THREE.Vector3(0,0,barrelLength+.1);
      rotor.localToWorld(muzzle);
      muzzle.project(camera);
      const sx=left+(muzzle.x+1)*width/2;
      const sy=top+(-muzzle.y+1)*height/2;
      const el=document.createElement('div');
      el.className='gatling-holo-bullet';
      el.style.cssText=`--shot:${hue};left:${sx}px;top:${sy}px`;
      document.body.appendChild(el);bullets.push(el);
      const dx=tx-sx,dy=ty-sy;
      const angle=Math.atan2(dy,dx)*180/Math.PI;
      el.animate([{transform:`translate(0,0) rotate(${angle}deg) scale(.6)`,opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${angle}deg) scale(1.1)`,opacity:1}],{duration:340,easing:'ease-in',fill:'forwards'}).onfinish=()=>{
        el.remove();const i=bullets.indexOf(el);if(i>=0)bullets.splice(i,1);
        target?.classList.add('bar-hit-flash','bar-shiver');
        setTimeout(()=>target?.classList.remove('bar-hit-flash','bar-shiver'),140);
      };
      glow.visible=true;
      lastShot=time;
    };
    const loop=(time)=>{
      if(done)return;
      const t=time-start;
      const appear=Math.min(1,Math.max(0,t/450));
      const fade=Math.min(1,Math.max(0,(2450-t)/370));
      weaponGroup.scale.setScalar(.08+.92*appear*fade);
      weaponGroup.position.y=.3*(1-appear);
      rotor.rotation.z=t>550&&t<1880?t*.029:0;
      turret.position.z=t>550&&t<1880?-.10*Math.abs(Math.sin(t*.045)):0;
      glow.visible=t-lastShot<75;
      if(t>650&&t<1780&&t-lastShot>140)shot(t);
      renderer.render(scene,camera);
      if(t>=2500){finish();return;}
      frame=requestAnimationFrame(loop);
    };
    frame=requestAnimationFrame(loop);
  } catch(err) {
    console.warn('Gatling hologram WebGL fallback:',err);
    renderer?.dispose();renderer?.domElement?.remove();
    // Keep the attack functional on devices without WebGL.
    host.classList.add('gatling-holo-fallback');
    host.insertAdjacentHTML('beforeend','<div class="gatling-holo-fallback-label">GATLING CINETICA</div>');
    setTimeout(finish,850);
  }
}
