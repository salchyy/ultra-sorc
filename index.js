
const SettingsUI = require('tera-mod-ui').Settings

module.exports = function ultrasorc(mod) {
	
	let ui = null
	if (global.TeraProxy.GUIMode) {
		ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { height: 390 })
		ui.on('update', settings => {
			mod.settings = settings
		})
		
		this.destructor = () => {
			if (ui) {
				ui.close()
				ui = null
			}
		}
	}	
	
	
	const options = mod.settings
	const { player } = mod.require.library;
	mod.game.initialize("me.abnormalities");
	mod.game.initialize('inventory');
	
	//Variables
	let salchy = global.sharedTeraState
	let myIcesAngle
	let distance = 1000
	let dolance = false
	let stacks = 0
	let replaced = false
	let fusion_enabled = false
	let implosion_enabled = false
	let jaunt_loc
	let use_backstep = false
	let packet_structure = null
	let distance_limit = 550;
	
	//CDs
	let isCD_prime = false
	let isCD_iceberg = false
	let isCD_arcane_fus = false
	let isCD_fusion = false
	let isCD_arcane = false
	let isCD_fb = false
	let isCD_hail = false
	let isCD_void = false
	let isCD_nova = false
	let isCD_frost = false
	let isCD_light = false
	let isCD_barrage = false
	let isCD_mb = false
	let isCD_implosion = false
	let isCD_jaunt = false
	let isCD_backstep = false
	let isCD_lances = false
	let isCD_flaming = false
	let isCD_arcane_instance = false
	
	//IDs
	let fire_buff = 502070
	let ice_buff = 502071
	let arcane_buff = 502072
	let fire_enab = false
	let ice_enab = false
	let arcane_enab = false
	let fusion_category = 5036
	let implosion_category = 5039
	let arcane_grant_id = 41212
	let prime_id = 360200
	let iceberg_id = 360400
	let arcane_fus_id = 360300
	let fusion_id = 360600
	let arcane_press_id = 41200
	let fusion_enab = 502050
	let urgency_id = 9100100
	let lances_id = 350100
	let implosion_id = 390100
	let stun_trap = 30300
	let fb_id = 61000
	let hail_id = 270900
	let void_id = 120900
	let nova_id = 300900
	let frost_id = 21000
	let light_id = 111100
	let barrage_id = 200500
	let mb_id = 340230
	let jaunt_id = 260100
	let backstep_id = 70100
	let basic_id = 11200
	let flaming_id = 200500
	let flaming_lock_id = 200510
	let arcane_instance_id = 330112
	
	let super_arcane = 41213
	
	let mb_buff_id = 503061
	let in_mb = false
	
	let fireStacks = false
	let iceStacks = false
	let lightStacks = false
	
	
	//Boss
	let block_hit = false
	
	const root_id = 80081;
	let isCD_root = false;
	let broochID = null
	let isCD_brooch = false
	let isBossClose = false;
	let hasManaBoostBuff = false;
	var skillTimeouts = {};	

	
	mod.command.add('sorc', () => {
		options.enabled = !options.enabled
		mod.command.message(`Ultra sorc mod is now ${(options.enabled) ? 'en' : 'dis'}abled.`)
	})
	
	mod.command.add("sorcui", () => { if (ui) ui.show() })

	mod.hook('S_LOAD_TOPO', 3, { order: 1000, filter: { fake: false } }, event => {
		broochID = mod.game.inventory.equipment.slots[20];	
	})	
	
	mod.hook('S_SKILL_CATEGORY', 3, { order: 1000, filter: { fake: false } }, event => {
		if(!options.enabled || mod.game.me.class !== 'sorcerer') return	
		if(event.category==fusion_category) {
			fusion_enabled = event.enabled
		}
		if(event.category==implosion_category) {
			implosion_enabled = event.enabled
		}		
	})

	mod.hook('S_PLAYER_STAT_UPDATE', 14, { order: 1000, filter: { fake: false } }, event => {
		if(!options.enabled || mod.game.me.class !== 'sorcerer') return
			fireStacks = event.fireEdge > 0;
			iceStacks = event.iceEdge > 0;
			lightStacks = event.lightningEdge > 0;
	})		

	mod.hook('S_START_COOLTIME_SKILL', 3, { order: 1000, filter: { fake: false } }, event => {
		if(!options.enabled || mod.game.me.class !== 'sorcerer') return	

		function startCooldown(skillId) {
			if (skillTimeouts[skillId]) {
				clearTimeout(skillTimeouts[skillId]);
			}
			setCooldown(skillId, true);
			skillTimeouts[skillId] = setTimeout(() => {
				setCooldown(skillId, false);
				delete skillTimeouts[skillId];
			}, event.cooldown);
		}
		startCooldown(event.skill.id);
	});

	mod.hook('S_DECREASE_COOLTIME_SKILL', 3, { order: 1000, filter: { fake: false } }, event => {
		if(!options.enabled || mod.game.me.class !== 'sorcerer') return	

		function decreaseCooldown(skillId) {
			if (skillTimeouts[skillId]) {
				clearTimeout(skillTimeouts[skillId]);
			}
			setCooldown(skillId, true);
			skillTimeouts[skillId] = setTimeout(() => {
				setCooldown(skillId, false); 
				delete skillTimeouts[skillId];
			}, event.cooldown);
		}	
		decreaseCooldown(event.skill.id);
	});	

	mod.hook('S_ACTION_STAGE', 9, { order: -9999999, filter: { fake: null } }, event => {
		if(!options.enabled || mod.game.me.class !== 'sorcerer' || event.gameId !== mod.game.me.gameId) return
		const speed = (player.aspd / 100) * options.extraspeed;
		if(event.skill.id === arcane_press_id && event.stage === 2) {
			mod.send('C_PRESS_SKILL', 4, {
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: arcane_press_id
				},
				press: false,
				loc: salchy.myPosition,
				w: salchy.myAngle								
			});
		}		
		if(event.skill.id === implosion_id && options.fastimplosion) {
			setTimeout(() => {
				mod.send("S_ACTION_END", 5, {
					gameId: event.gameId,
					loc: event.loc,
					w: event.w,
					templateId: event.templateId,
					skill: event.skill,
					type: 4,
					id: event.id
				});
			}, options.implosiondelay / player.aspd);
		}
		if(options.fastskills) {
			event.speed += speed;
			event.projectileSpeed += speed;
			return true;
		}		
	})
	
	mod.hook('S_START_COOLTIME_ITEM', 1, event => {
		if(event.item == root_id) {
			isCD_root = true;
			setTimeout(function () {
				isCD_root = false
			}, event.cooldown * 1000);			
		};
		if (broochID && event.item == broochID.id) {
			isCD_brooch = true
			setTimeout(function () {
				isCD_brooch = false
			}, event.cooldown * 1000)
		}		
	});		
	mod.hook('C_START_SKILL', 7, { order: -9999999, filter: { fake: null } }, (event) => {
		if(!options.enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		myIcesAngle = event.w
		broochID = broochID || mod.game.inventory.equipment.slots[20];
		isBossClose = salchy.bossId && salchy.bossLoc && (salchy.distanceFromBoss <= distance_limit);
		hasManaBoostBuff = mod.game.me.abnormalities[mb_buff_id];

				
		if(event.skill.id===stun_trap) {
				replaced = false
				checkRootAndBroochOptions(event);
				adjustAngleForBoss(event);
				backstepConditions(event);
				//prioritizeElementalSkills(event);
				iceLancesConditions();
				hailStormConditions(event);
				manaBoostConditions(event);
				primeConditions(event);
				elementalFusionConditions(event);
				//arcanePulseConditions(event);
				if(options.arcane_pulse && options.boostarcane && !isCD_arcane_instance && !replaced && isBossClose && hasManaBoostBuff) {
					mod.send('C_START_INSTANCE_SKILL', 7, {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: arcane_instance_id
						},
						loc: salchy.myPosition,
						w: myIcesAngle,
						continue: false,
						targets: [
							{
								arrowId: 0,
								gameId: salchy.bossId,
								hitCylinderId: 0
							}
						],								
						endpoints: [salchy.bossLoc]				
					})
					return false;
				}				
				if(options.arcane_pulse && !isCD_arcane && !replaced && (!hasManaBoostBuff || (hasManaBoostBuff && !options.boostarcane))) {
					mod.send('C_PRESS_SKILL', 4, {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: arcane_press_id
						},
						press: true,
						loc: salchy.myPosition,
						w: salchy.myAngle								
					})
					return false;
				}				
				voidPulseConditions(event);
				novaConditions(event);
				implosionConditions(event);
				meteorStrikeConditions(event);
				lightningStrikeConditions(event);
				frostConditions(event);
				//flamingConditions(event);
				//basicConditions(event);
				if(!isCD_flaming && options.flaming && !replaced && isBossClose) {
					event.skill.id = flaming_id
					event.target = salchy.bossId
					let packet_lock = event;
					mod.send('C_START_SKILL', 7, event)
					setTimeout(() => {
						mod.send("C_CAN_LOCKON_TARGET", 3, {
							target: salchy.bossId,
							unk: 0,
							skill: {
								reserved: 0,
								npc: false,
								type: 1,
								huntingZoneId: 0,
								id: flaming_id
							}
						});
					}, 10);
					setTimeout(() => {
						packet_lock.skill.id = flaming_lock_id
						packet_lock.target = salchy.bossId
						mod.send("C_START_SKILL", 7, packet_lock);
					}, 50);				
					return false
				}				
				if(!fireStacks && isCD_void && isCD_fb && options.boss && isBossClose && !replaced) {
					mod.send('C_START_INSTANCE_SKILL', 7, {
						skill: {
							reserved: 0,
							npc: false,
							type: 1,
							huntingZoneId: 0,
							id: basic_id
						},
						loc: salchy.myPosition,
						w: myIcesAngle,
						continue: false,
						targets: [
							{
								arrowId: 0,
								gameId: salchy.bossId,
								hitCylinderId: 0
							}
						],								
						endpoints: [salchy.bossLoc]				
					})
					return false;
				}				
				return replaced;
		}			
	})
	mod.hook('C_PRESS_SKILL', 4, { filter: { fake: false } }, (event) => {
		if(!options.enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		if(event.skill.id==arcane_press_id && !event.press) {
			return false
		}	
	})	

	mod.hook('S_START_USER_PROJECTILE', 9, event => {
		if (!options.enabled || mod.game.me.class !== 'sorcerer' || event.gameId !== mod.game.me.gameId || !options.autoaim || !options.boss || !isBossClose) {
			return;
		}
		block_hit = false;
		let targets = [{
		gameId: salchy.bossId
		}];					
		if(!targets[0]) {
			block_hit = false
			return
		} else {
			block_hit = true
			mod.send('S_START_USER_PROJECTILE', 9, event)
			mod.send('C_HIT_USER_PROJECTILE', 4, {
				id: event.id,
				end: event.end,
				loc: salchy.bossLoc,
				targets: targets
			});			
			return false	
		}
	})
	mod.hook('C_HIT_USER_PROJECTILE', 4, { filter: { fake: false } }, event => {
		if(mod.game.me.class !== 'sorcerer') return
		if(options.enabled && options.autoaim && block_hit && event.targets[0]) {
			if(event.targets[0].gameId==salchy.bossId) return false
		}
		
	})

	function setCooldown(skillId, isOnCooldown) {
		switch (skillId) {
			case mb_id: isCD_mb = isOnCooldown; break;
			case implosion_id: isCD_implosion = isOnCooldown; break;
			case prime_id: isCD_prime = isOnCooldown; break;
			case iceberg_id: isCD_iceberg = isOnCooldown; break;
			case arcane_fus_id: isCD_arcane_fus = isOnCooldown; break;
			case fusion_id: isCD_fusion = isOnCooldown; break;
			case arcane_press_id: isCD_arcane = isOnCooldown; break;
			case fb_id: isCD_fb = isOnCooldown; break;
			case hail_id: isCD_hail = isOnCooldown; break;
			case void_id: isCD_void = isOnCooldown; break;
			case nova_id: isCD_nova = isOnCooldown; break;
			case frost_id: isCD_frost = isOnCooldown; break;
			case light_id: isCD_light = isOnCooldown; break;
			case barrage_id: isCD_barrage = isOnCooldown; break;
			case jaunt_id: isCD_jaunt = isOnCooldown; break;
			case backstep_id: isCD_backstep = isOnCooldown; break;
			case lances_id: isCD_lances = isOnCooldown; break;
			case flaming_id: isCD_flaming = isOnCooldown; break;
			case arcane_instance_id: isCD_arcane_instance = isOnCooldown; break;
		}
	}	

    function getSkillInfo(id) {
		let nid = id;
        return {
            id: nid,
            group: Math.floor(nid / 10000),
            level: Math.floor(nid / 100) % 100,
            sub: nid % 100
        };
    }

	function lances(d, n) {
		CastLances((Math.cos(myIcesAngle) * d) + salchy.myPosition.x, (Math.sin(myIcesAngle) * d) + salchy.myPosition.y, salchy.myPosition.z + n, myIcesAngle);
	}
	function CastLances(x, y, z, w = 0) {

		if(options.boss && salchy.bossId && salchy.bossLoc && (salchy.distanceFromBoss <= distance_limit)) {
			x = salchy.bossLoc.x
			y = salchy.bossLoc.y
			z = salchy.bossLoc.z	
		}				
		mod.send('C_START_SKILL', 7, {
			skill: {
				reserved: 0,
				npc: false,
				type: 1,
				huntingZoneId: 0,
				id: lances_id
			},
			w: myIcesAngle,
			loc: salchy.myPosition,
			dest: {
				x: x,
				y: y,
				z: z
			},
			unk: true,
			moving: false,
			continue: false,
			target: 0,
			unk2: false						
		})		
	}

    function calculateAngle(playerLocation, enemyLocation) {
        const dx = enemyLocation.x - playerLocation.x;
        const dy = enemyLocation.y - playerLocation.y;
        let theta = Math.atan2(dy, dx);
        return theta;
    }
    function use_item(itemId) {
		mod.send('C_USE_ITEM', 3, {
			gameId: mod.game.me.gameId,
			id: itemId,
			dbid: 0,
			target: 0,
			amount: 1,
			dest: {
				x: 0,
				y: 0,
				z: 0
			},
			loc:salchy.myPosition,
			w: salchy.myAngle,
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: true
		})
	}
	
	function prioritizeElementalSkills(event) {
		if(!hasManaBoostBuff) return
		const missingElements = getMissingElements();
		if (missingElements.includes('fire') && tryReplaceSkillWithFireElement(event)) return;
		if (missingElements.includes('ice') && tryReplaceSkillWithIceElement(event)) return;
		if (missingElements.includes('lightning') && tryReplaceSkillWithLightningElement(event)) return;
	}

	function getMissingElements() {
		const elements = [];
		if (!fireStacks) elements.push('fire');
		if (!iceStacks) elements.push('ice');
		if (!lightStacks) elements.push('lightning');
		return elements;
	}

	function tryReplaceSkillWithFireElement(event) {
		voidPulseConditions(event);
		meteorStrikeConditions(event);
		basicConditions(event);
	}

	function tryReplaceSkillWithIceElement(event) {
		hailStormConditions(event);
		iceLancesConditions();
		frostConditions(event);
	}

	function tryReplaceSkillWithLightningElement(event) {
		arcanePulseConditions(event);
		novaConditions(event);
		lightningStrikeConditions(event);
	}	

	function checkRootAndBroochOptions(event) {
		if (options.root && !isCD_root && isBossClose && hasManaBoostBuff && (mod.game.inventory.getTotalAmountInBag(root_id) > 0)) {
			packet_structure = event;
			use_item(root_id);
		}
		if (options.brooch && !isCD_brooch && isBossClose && hasManaBoostBuff) {
			packet_structure = event;
			use_item(broochID.id);
		}
	}

	function adjustAngleForBoss(event) {
		if (options.boss && isBossClose) {
			const angle = calculateAngle(global.sharedTeraState.myPosition, global.sharedTeraState.bossLoc);
			event.w = angle;
			global.sharedTeraState.myAngle = angle;
			myIcesAngle = angle;
		}
	}

	function backstepConditions(event) {
		if(options.implosion && options.backstep && isCD_implosion && !isCD_backstep && use_backstep && !replaced) {
					event.skill.id = backstep_id
					replaced = true
		}
		return replaced;		
	}
	function iceLancesConditions() {
		if(options.ice_lances && !isCD_lances && !replaced) {
					lances(distance,0)
					dolance = false
		}		
	}

	function hailStormConditions(event) {
		if(options.hail_storm && !isCD_hail && !replaced) {
			event.skill.id = hail_id
			replaced = true					
		}
		return replaced;		
	}
	function manaBoostConditions(event) {
		if(!isCD_mb && !replaced && options.manaboost && isBossClose) {
			event.skill.id = mb_id
			replaced = true
		}
		return replaced;		
	}	
	
	
	function primeConditions(event) {
		if(options.prime_fusion && !isCD_prime && !replaced && fusion_enabled) {
			const hasFireBuff = mod.game.me.abnormalities[fire_buff];
			const hasIceBuff = mod.game.me.abnormalities[ice_buff];
			const hasArcaneBuff = mod.game.me.abnormalities[arcane_buff];
			const hasNoBuff = !hasFireBuff && !hasIceBuff && !hasArcaneBuff;
			const hasPrimeBuff = hasFireBuff || hasIceBuff;
			const condition_mb = hasNoBuff && hasManaBoostBuff;
			const condition_prime = (hasNoBuff || hasPrimeBuff) && !hasManaBoostBuff;
			const condition_iceberg = hasArcaneBuff && !hasManaBoostBuff;
			
			if (options.boss && isBossClose && (condition_mb || condition_prime || condition_iceberg)) {
				event.dest = salchy.bossLoc;
			}
			if ((!options.boss || (options.boss && !isBossClose)) && (condition_mb || condition_prime || condition_iceberg)) {
				event.dest.x = (Math.cos(myIcesAngle) * distance) + salchy.myPosition.x;
				event.dest.y = (Math.sin(myIcesAngle) * distance) + salchy.myPosition.y;
				event.dest.z = salchy.myPosition.z;
			}					
			if (condition_mb || condition_prime) {
				event.skill.id = prime_id;
				replaced = true;
			}
			if (hasArcaneBuff) {
				event.skill.id = iceberg_id;
				replaced = true;
			}
		}		
		return replaced;
	}
	function elementalFusionConditions(event) {
		if(options.elemental_fusion && !isCD_fusion && fusion_enabled && !replaced && hasManaBoostBuff) {	
			event.skill.id = fusion_id
			replaced = true					
		}		
		return replaced;
	}
	function arcanePulseConditions(event) {
		if(options.arcane_pulse && !isCD_arcane && !replaced) {
			mod.send('C_PRESS_SKILL', 4, {
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: arcane_press_id
				},
				press: true,
				loc: salchy.myPosition,
				w: salchy.myAngle								
			})
		}		
		return replaced;
	}	
	function voidPulseConditions(event) {
		if(options.void_pulse && !isCD_void && !replaced) {
			event.skill.id = void_id
			if (options.boss && isBossClose) {
				event.dest = salchy.bossLoc;
			}
			if (!options.boss || (options.boss && !isBossClose)) {
				event.dest.x = (Math.cos(myIcesAngle) * distance) + salchy.myPosition.x;
				event.dest.y = (Math.sin(myIcesAngle) * distance) + salchy.myPosition.y;
				event.dest.z = salchy.myPosition.z;
			}					
			replaced = true
		}		
		return replaced;
	}	
	function novaConditions(event) {
		if(options.nova && !isCD_nova && !replaced) {
			event.skill.id = nova_id
			lances(distance,0)
			if(isCD_lances) { 
				dolance = true;
			}
			replaced = true
		}
		return replaced;
	}	
	function implosionConditions(event) {
		if(options.implosion && !isCD_implosion && !isCD_fb && implosion_enabled && isBossClose && salchy.enraged && !replaced && hasManaBoostBuff) {
			event.skill.id = implosion_id
			replaced = true
			if(options.backstep && !use_backstep) {
				use_backstep = true
				setTimeout(function () {
					use_backstep = false
				}, 1500 )
			}
		}		
		return replaced;
	}
	function meteorStrikeConditions(event) {
		if(options.meteor_strike && !isCD_fb && !replaced) {
			event.skill.id = fb_id
			replaced = true
			if(options.implosion && isCD_implosion) {
				use_backstep = false
			}
		}		
		return replaced;
	}
	function lightningStrikeConditions(event) {
		if(options.lightning_strike && !isCD_light && !replaced) {
			event.skill.id = light_id
			replaced = true
		}		
		return replaced;
	}
	function frostConditions(event) {
		if(isCD_hail && !isCD_frost && options.frost_sphere && !replaced) {
			event.skill.id = frost_id
			if (options.boss && isBossClose) {
				event.dest = salchy.bossLoc;
			}
			if (!options.boss || (options.boss && !isBossClose)) {
				event.dest.x = (Math.cos(myIcesAngle) * distance) + salchy.myPosition.x;
				event.dest.y = (Math.sin(myIcesAngle) * distance) + salchy.myPosition.y;
				event.dest.z = salchy.myPosition.z;
			}										
			replaced = true
		}		
		return replaced;
	}

	function flamingConditions(event) {
		if(!isCD_flaming && options.flaming && !replaced && isBossClose) {
			event.skill.id = flaming_id
			event.target = salchy.bossId
			let packet_lock = event;
			mod.send('C_START_SKILL', 7, event)
			setTimeout(() => {
				mod.send("C_CAN_LOCKON_TARGET", 3, {
					target: event.gameId,
					unk: event.loc,
					skill: event.w,
				});
			}, 10);
			setTimeout(() => {
				packet_lock.skill.id = flaming_lock_id
				packet_lock.target = salchy.bossId
				mod.send("C_START_SKILL", 7, packet_lock);
			}, 50);				
			replaced = true
		}		
		return replaced;
	}

	
	function basicConditions(event) {
		if(!fireStacks && isCD_void && isCD_fb && options.boss && isBossClose && !replaced) {
				mod.send('C_START_INSTANCE_SKILL', 7, {
					skill: {
						reserved: 0,
						npc: false,
						type: 1,
						huntingZoneId: 0,
						id: basic_id
					},
					loc: salchy.myPosition,
					w: myIcesAngle,
					continue: false,
					targets: [
						{
							arrowId: 0,
							gameId: salchy.bossId,
							hitCylinderId: 0
						}
					],								
					endpoints: [salchy.bossLoc]				
				})
		}		
		return replaced;
	}	
	
}
