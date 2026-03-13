export interface Buff {
  id: string;
  type: 'atk_up' | 'spd_up' | 'shield' | 'taunt' | 'stun' | 'def_down' | 'spd_down' | 'silence' | 'dmg_amp' | 'energy_down';
  value: number;
  duration: number;
  sourceId?: string;
}

export interface CombatHero {
  id: string;
  instanceId: string;
  name: string;
  avatar: string;
  team: 'player' | 'enemy';
  position: number;
  
  max_hp: number;
  hp: number;
  atk: number;
  int_stat: number;
  def_stat: number;
  spd: number;
  
  energy: number;
  attack_cooldown: number;
  
  shield: number;
  buffs: Buff[];
  
  // Passive states
  has_revived?: boolean;
}

export interface BattleEvent {
  type: 'attack' | 'skill' | 'damage' | 'heal' | 'buff' | 'shout';
  sourceId?: string;
  targetId?: string;
  value?: number;
  text?: string;
  isMagic?: boolean;
}

export interface BattleLog {
  time: number;
  message: string;
  type: 'attack' | 'skill' | 'death' | 'info';
}

export class BattleEngine {
  heroes: CombatHero[] = [];
  logs: BattleLog[] = [];
  time: number = 0;
  onUpdate?: () => void;
  onEvent?: (event: BattleEvent) => void;
  onEnd?: (winner: 'player' | 'enemy') => void;
  isFinished: boolean = false;
  
  constructor(playerLineup: CombatHero[], enemyLineup: CombatHero[]) {
    this.heroes = [...playerLineup, ...enemyLineup].map(h => ({
      ...h,
      shield: 0,
      buffs: []
    }));
    
    // Trigger battle start passives
    this.triggerBattleStartPassives();
  }
  
  triggerBattleStartPassives() {
    const livingHeroes = this.heroes.filter(h => h.hp > 0);
    for (const hero of livingHeroes) {
      if (hero.id === 'lijing') {
        const allies = livingHeroes.filter(h => h.team === hero.team);
        for (const ally of allies) {
          ally.shield += ally.max_hp * 0.2;
        }
        this.emitEvent({ type: 'shout', sourceId: hero.instanceId, text: '军神庇佑！' });
      } else if (hero.id === 'zhangsunwuji') {
        const allies = livingHeroes.filter(h => h.team === hero.team);
        for (const ally of allies) {
          ally.int_stat *= 1.15;
          ally.def_stat *= 1.15;
        }
        this.emitEvent({ type: 'shout', sourceId: hero.instanceId, text: '辅政之才！' });
      } else if (hero.id === 'qinqiong') {
        this.emitEvent({ type: 'shout', sourceId: hero.instanceId, text: '门神在此！' });
      }
    }
  }
  
  emitEvent(event: BattleEvent) {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }
  
  update(delta_time: number) {
    if (this.isFinished) return;
    
    this.time += delta_time;
    let stateChanged = false;
    
    const livingHeroes = this.heroes.filter(h => h.hp > 0);
    
    // Check win condition
    const playerAlive = livingHeroes.some(h => h.team === 'player');
    const enemyAlive = livingHeroes.some(h => h.team === 'enemy');
    
    if (!playerAlive || !enemyAlive) {
      this.isFinished = true;
      if (this.onEnd) {
        this.onEnd(playerAlive ? 'player' : 'enemy');
      }
      return;
    }
    
    for (const hero of livingHeroes) {
      // Update buffs
      for (let i = hero.buffs.length - 1; i >= 0; i--) {
        hero.buffs[i].duration -= delta_time;
        if (hero.buffs[i].duration <= 0) {
          hero.buffs.splice(i, 1);
        }
      }
      
      const isStunned = hero.buffs.some(b => b.type === 'stun');
      if (isStunned) continue;
      
      hero.attack_cooldown -= delta_time;
      
      if (hero.attack_cooldown <= 0) {
        // Find target
        let enemies = livingHeroes.filter(h => h.team !== hero.team && h.hp > 0);
        
        // Handle taunt
        const tauntingEnemies = enemies.filter(e => e.buffs.some(b => b.type === 'taunt'));
        if (tauntingEnemies.length > 0) {
          enemies = tauntingEnemies;
        }
        
        if (enemies.length > 0) {
          // Random target for now
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          
          this.emitEvent({ type: 'attack', sourceId: hero.instanceId, targetId: target.instanceId });
          
          // Calculate stats with buffs
          let atk = hero.atk;
          if (hero.buffs.some(b => b.type === 'atk_up')) atk *= 1.3;
          if (hero.id === 'chaishao') atk *= 1.2; // Simplified passive
          
          let def = target.def_stat;
          if (target.buffs.some(b => b.type === 'def_down')) def *= 0.5;
          
          // Deal Physical Damage
          let damage = (atk * 1.0) * (300 / (300 + def));
          
          // Passives
          if (hero.id === 'sudingfang') damage *= 1.25;
          if (target.id === 'guoziyi' && target.hp < target.max_hp * 0.5) damage *= 0.6;
          if (target.buffs.some(b => b.type === 'dmg_amp')) damage *= 1.4;
          
          // Qinqiong passive (simplified)
          const qinqiong = livingHeroes.find(h => h.team === target.team && h.id === 'qinqiong');
          if (qinqiong) damage *= 0.85;
          
          this.dealDamage(hero, target, damage, false);
          
          // Yuchigong passive
          if (target.id === 'yuchigong' && Math.random() < 0.2) {
            hero.buffs.push({ id: Math.random().toString(), type: 'stun', value: 0, duration: 2 });
            this.emitEvent({ type: 'buff', targetId: hero.instanceId, text: '缴械' });
          }
          
          // Fangxuanling passive
          if (hero.id === 'fangxuanling' && Math.random() < 0.3) {
            // Simplified: just deal some extra magic damage
            this.dealDamage(hero, target, hero.int_stat * 0.5, true);
          }
          
          // Reset attack cooldown
          let spd = hero.spd;
          if (hero.buffs.some(b => b.type === 'spd_up')) spd *= 1.3;
          if (hero.buffs.some(b => b.type === 'spd_down')) spd *= 0.7;
          const current_attack_interval = 1.0 / (spd / 100.0);
          hero.attack_cooldown = current_attack_interval;
          stateChanged = true;
        }
      }
      
      // Check active skill
      const isSilenced = hero.buffs.some(b => b.type === 'silence');
      if (hero.hp > 0 && hero.energy >= 100 && !isSilenced) {
        hero.energy = 0;
        this.castActive(hero, livingHeroes);
        stateChanged = true;
      }
    }
    
    if (stateChanged && this.onUpdate) {
      this.onUpdate();
    }
  }
  
  dealDamage(attacker: CombatHero, target: CombatHero, amount: number, isMagic: boolean) {
    let actualDamage = Math.max(1, Math.floor(amount));
    
    // Shield
    if (target.shield > 0) {
      if (target.shield >= actualDamage) {
        target.shield -= actualDamage;
        actualDamage = 0;
      } else {
        actualDamage -= target.shield;
        target.shield = 0;
      }
    }
    
    if (actualDamage > 0) {
      target.hp -= actualDamage;
      this.emitEvent({ type: 'damage', targetId: target.instanceId, value: actualDamage, isMagic });
      this.log(`${attacker.name} 攻击了 ${target.name}，造成了 ${actualDamage} 点${isMagic ? '谋略' : '物理'}伤害`, 'attack');
      
      // Energy logic
      let energyGain = 10;
      if (target.buffs.some(b => b.type === 'energy_down')) energyGain = 5;
      
      attacker.energy = Math.min(100, attacker.energy + 10);
      target.energy = Math.min(100, target.energy + energyGain);
      
      // Chengyaojin passive
      if (target.id === 'chengyaojin' && Math.random() < 0.1) {
        this.heal(target, target.max_hp * 0.08);
      }
      
      if (target.hp <= 0) {
        // Weizheng passive
        const weizheng = this.heroes.find(h => h.team === target.team && h.id === 'weizheng' && h.hp > 0);
        if (weizheng && !target.has_revived) {
          target.hp = 1;
          target.has_revived = true;
          this.emitEvent({ type: 'shout', sourceId: weizheng.instanceId, text: '犯颜直谏！' });
          this.emitEvent({ type: 'buff', targetId: target.instanceId, text: '免死' });
        } else {
          target.hp = 0;
          this.log(`${target.name} 阵亡了`, 'death');
        }
      }
    }
  }
  
  heal(target: CombatHero, amount: number) {
    const actualHeal = Math.floor(amount);
    target.hp = Math.min(target.max_hp, target.hp + actualHeal);
    this.emitEvent({ type: 'heal', targetId: target.instanceId, value: actualHeal });
  }
  
  castActive(caster: CombatHero, livingHeroes: CombatHero[]) {
    const enemies = livingHeroes.filter(h => h.team !== caster.team && h.hp > 0);
    const allies = livingHeroes.filter(h => h.team === caster.team && h.hp > 0);
    
    this.emitEvent({ type: 'skill', sourceId: caster.instanceId });
    
    // Lishimin passive
    const lishimin = allies.find(h => h.id === 'lishimin');
    if (lishimin && lishimin.instanceId !== caster.instanceId) {
      lishimin.energy = Math.min(100, lishimin.energy + 10);
    }
    
    if (caster.id === 'lishimin') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '天策神威！' });
      for (const ally of allies) {
        ally.buffs.push({ id: Math.random().toString(), type: 'atk_up', value: 0.3, duration: 5 });
        ally.buffs.push({ id: Math.random().toString(), type: 'spd_up', value: 0.3, duration: 5 });
        this.emitEvent({ type: 'buff', targetId: ally.instanceId, text: '攻速/攻击提升' });
      }
    } else if (caster.id === 'lijing') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '六军辟易！' });
      for (const enemy of enemies) {
        const damage = (caster.int_stat + caster.atk) * 2.0 * (300 / (300 + enemy.def_stat));
        this.dealDamage(caster, enemy, damage, true);
      }
    } else if (caster.id === 'xuerengui') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '三箭定天山！' });
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        let killed = false;
        for (let i = 0; i < 3; i++) {
          if (target.hp > 0) {
            const damage = (caster.atk * 2.5) * (300 / (300 + target.def_stat));
            this.dealDamage(caster, target, damage, false);
            if (target.hp <= 0) killed = true;
          }
        }
        if (killed) caster.energy = 100;
      }
    } else if (caster.id === 'guoziyi') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '定国安邦！' });
      caster.buffs.push({ id: Math.random().toString(), type: 'taunt', value: 0, duration: 4 });
      this.emitEvent({ type: 'buff', targetId: caster.instanceId, text: '嘲讽' });
    } else if (caster.id === 'sudingfang') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '千里破阵！' });
      if (enemies.length > 0) {
        const target = enemies.reduce((prev, current) => (prev.int_stat > current.int_stat) ? prev : current);
        const damage = (caster.atk * 3.0) * (300 / (300 + target.def_stat));
        this.dealDamage(caster, target, damage, false);
        target.buffs.push({ id: Math.random().toString(), type: 'stun', value: 0, duration: 2 });
        this.emitEvent({ type: 'buff', targetId: target.instanceId, text: '眩晕' });
      }
    } else if (caster.id === 'qinqiong') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '撒手锏！' });
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const damage = (caster.atk * 4.0) * (300 / (300 + target.def_stat));
        this.dealDamage(caster, target, damage, false);
        target.buffs.push({ id: Math.random().toString(), type: 'def_down', value: 0.5, duration: 5 });
        this.emitEvent({ type: 'buff', targetId: target.instanceId, text: '破甲' });
      }
    } else if (caster.id === 'yuchigong') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '铁鞭震岳！' });
      for (const enemy of enemies) {
        const damage = (caster.atk * 2.0) * (300 / (300 + enemy.def_stat));
        this.dealDamage(caster, enemy, damage, false);
        enemy.buffs.push({ id: Math.random().toString(), type: 'spd_down', value: 0.3, duration: 5 });
        this.emitEvent({ type: 'buff', targetId: enemy.instanceId, text: '减速' });
      }
    } else if (caster.id === 'chengyaojin') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '三板斧！' });
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        let killed = false;
        const multipliers = [1.0, 1.5, 2.0];
        for (let i = 0; i < 3; i++) {
          if (target.hp > 0) {
            const damage = (caster.atk * multipliers[i]) * (300 / (300 + target.def_stat));
            this.dealDamage(caster, target, damage, false);
            if (target.hp <= 0) killed = true;
          }
        }
        if (killed) this.heal(caster, caster.max_hp * 0.3);
      }
    } else if (caster.id === 'weizheng') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '梦斩泾河龙！' });
      for (const enemy of enemies) {
        const damage = (caster.int_stat * 1.5) * (300 / (300 + enemy.int_stat));
        this.dealDamage(caster, enemy, damage, true);
        if (Math.random() < 0.5) {
          enemy.buffs.push({ id: Math.random().toString(), type: 'silence', value: 0, duration: 3 });
          this.emitEvent({ type: 'buff', targetId: enemy.instanceId, text: '沉默' });
        }
      }
    } else if (caster.id === 'zhangsunwuji') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '凌烟阁首！' });
      if (enemies.length > 0) {
        const target = enemies.reduce((prev, current) => (prev.atk > current.atk) ? prev : current);
        target.buffs.push({ id: Math.random().toString(), type: 'dmg_amp', value: 0.4, duration: 5 });
        this.emitEvent({ type: 'buff', targetId: target.instanceId, text: '易伤' });
      }
    } else if (caster.id === 'fangxuanling') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '运筹帷幄！' });
      for (const ally of allies) {
        this.heal(ally, caster.int_stat * 2.5);
        ally.buffs = []; // Dispel
        this.emitEvent({ type: 'buff', targetId: ally.instanceId, text: '净化' });
      }
    } else if (caster.id === 'duruhui') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '决胜千里！' });
      for (const enemy of enemies) {
        const damage = (caster.int_stat * 1.2) * (300 / (300 + enemy.int_stat));
        this.dealDamage(caster, enemy, damage, true);
        enemy.buffs.push({ id: Math.random().toString(), type: 'energy_down', value: 0.5, duration: 5 });
        this.emitEvent({ type: 'buff', targetId: enemy.instanceId, text: '疲惫' });
      }
    } else if (caster.id === 'houjunji') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '灭国之威！' });
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        let damage = (caster.atk * 3.5) * (300 / (300 + target.def_stat));
        if (target.buffs.length > 0) {
          damage += caster.atk * 1.5; // True damage simplified
        }
        this.dealDamage(caster, target, damage, false);
      }
    } else if (caster.id === 'liji') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '破军星降！' });
      const backline = enemies.filter(e => e.position >= 6);
      const targets = backline.length > 0 ? backline : enemies;
      for (const enemy of targets) {
        const damage = (caster.int_stat * 2.0) * (300 / (300 + enemy.int_stat));
        this.dealDamage(caster, enemy, damage, true);
        enemy.buffs.push({ id: Math.random().toString(), type: 'stun', value: 0, duration: 1.5 });
        this.emitEvent({ type: 'buff', targetId: enemy.instanceId, text: '眩晕' });
      }
    } else if (caster.id === 'chaishao') {
      this.emitEvent({ type: 'shout', sourceId: caster.instanceId, text: '霍邑之战！' });
      for (const enemy of enemies) {
        const damage = (caster.atk * 1.8) * (300 / (300 + enemy.def_stat));
        this.dealDamage(caster, enemy, damage, false);
      }
    } else {
      // Default fallback
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const damage = (caster.int_stat * 2.0) * (300 / (300 + target.int_stat));
        this.dealDamage(caster, target, damage, true);
      }
    }
  }
  
  log(message: string, type: BattleLog['type']) {
    this.logs.push({
      time: this.time,
      message,
      type
    });
  }
}
