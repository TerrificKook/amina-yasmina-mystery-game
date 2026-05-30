import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { actionLevels } from '../../data/actionLevels.js';
import { useGame } from '../../context/GameContext.jsx';
import CharacterSprite from '../ui/CharacterSprite.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

const playerSize = 34;
const itemRadius = 28;
const helperRadius = 62;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rectsOverlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const pointInRect = (point, rect) =>
  point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h;

function makePlayerRect(position) {
  return {
    x: position.x - playerSize / 2,
    y: position.y - playerSize / 2,
    w: playerSize,
    h: playerSize,
  };
}

function getMoveVector(keys, mobileDir) {
  let x = mobileDir.x;
  let y = mobileDir.y;

  if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
  if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;

  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

function makeLegacyZone(level) {
  return {
    id: level.id,
    title: level.title,
    shortTitle: 'Локация',
    theme: level.theme,
    width: level.width,
    height: level.height,
    start: level.start,
    goal: level.goalText,
    requiredForExit: level.requiredIds,
    nextZoneId: 'finish',
    exit: level.exit,
    obstacles: level.obstacles || [],
    hazards: level.hazards || [],
    enemies: level.enemies || [],
    helpers: level.helpers || [],
    collectibles: level.collectibles || [],
    paths: [],
    decorations: [],
  };
}

function makeEnemies(zone) {
  return (zone.enemies || []).map((enemy) => ({
    ...enemy,
    dir: enemy.dir || 1,
    homeX: enemy.x,
    homeY: enemy.y,
  }));
}

function getItemIcon(item) {
  if (item.type === 'diary-page') return 'Д';
  if (item.type === 'spark-piece') return 'И';
  if (item.type === 'track') return 'Т';
  if (item.type === 'token') return 'Ж';
  if (item.type === 'lake-light') return 'О';
  if (item.type === 'firefly-core') return 'К';
  if (item.type === 'energy') return '+';
  if (item.type === 'key-leaf') return 'Л';
  if (item.type === 'key-apple') return 'Я';
  if (item.type === 'key-star') return 'З';
  if (item.type === 'root-light') return 'И';
  if (item.type === 'cube') return 'К';
  if (item.type === 'step') return 'Ш';
  if (item.type === 'apple') return 'Я';
  if (item.type === 'page') return 'С';
  if (item.type === 'firefly') return 'О';
  return '!';
}

export default function ActionGameScreen() {
  const { storyId, character, currentStory, finishActionRun, restartStory } = useGame();
  const level = actionLevels[storyId] || actionLevels.polina;
  const zones = useMemo(() => (level.zones?.length ? level.zones : [makeLegacyZone(level)]), [level]);
  const maxHealth = level.maxHealth || (storyId === 'polina' ? 4 : 3);
  const [zoneIndex, setZoneIndex] = useState(0);
  const zone = zones[zoneIndex] || zones[0];
  const hero = currentStory.characters[character] || Object.values(currentStory.characters)[0];
  const [player, setPlayer] = useState(zone.start);
  const [health, setHealth] = useState(maxHealth);
  const [energy, setEnergy] = useState(100);
  const [shield, setShield] = useState(0);
  const [collected, setCollected] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [visitedZones, setVisitedZones] = useState([zone.id]);
  const [message, setMessage] = useState(level.messages.start);
  const [mobileDir, setMobileDir] = useState({ x: 0, y: 0 });
  const [revealUntil, setRevealUntil] = useState(0);
  const [dashUntil, setDashUntil] = useState(0);
  const [invulnerableUntil, setInvulnerableUntil] = useState(0);
  const [enemies, setEnemies] = useState(() => makeEnemies(zone));
  const [introIndex, setIntroIndex] = useState(level.intro?.length ? 0 : Number.POSITIVE_INFINITY);
  const [isMoving, setIsMoving] = useState(false);

  const keysRef = useRef(new Set());
  const playerRef = useRef(player);
  const shieldRef = useRef(shield);
  const collectedRef = useRef(collected);
  const revealedRef = useRef(revealed);
  const enemiesRef = useRef(enemies);
  const mobileDirRef = useRef(mobileDir);
  const lastDirRef = useRef({ x: 1, y: 0 });
  const movingRef = useRef(false);
  const damageCooldownRef = useRef(0);
  const noticeCooldownRef = useRef(0);
  const transitionCooldownRef = useRef(0);
  const wonRef = useRef(false);

  const introActive = introIndex < (level.intro?.length || 0);
  const currentIntro = introActive ? level.intro[introIndex] : null;
  const revealActive = Date.now() < revealUntil;
  const dashActive = Date.now() < dashUntil;

  const itemIndex = useMemo(() => {
    const map = new Map();
    (level.keyParts || []).forEach((item) => map.set(item.id, item));
    zones.forEach((currentZone) => {
      (currentZone.collectibles || []).forEach((item) => map.set(item.id, item));
    });
    return map;
  }, [level.keyParts, zones]);

  const requiredCount = level.requiredIds.length;
  const collectedCount = useMemo(
    () => level.requiredIds.filter((id) => collected.includes(id)).length,
    [collected, level.requiredIds],
  );
  const zoneRequired = zone.requiredForExit || level.requiredIds;
  const zoneMissing = zoneRequired.filter((id) => !collected.includes(id));
  const finalRequired = level.finalRequiredIds || level.requiredIds;
  const finalMissing = finalRequired.filter((id) => !collected.includes(id));
  const rootLightCount = ['root-light-1', 'root-light-2', 'root-light-3'].filter((id) => collected.includes(id)).length;
  const sx = useCallback((value) => `${(value / zone.width) * 100}%`, [zone.width]);
  const sy = useCallback((value) => `${(value / zone.height) * 100}%`, [zone.height]);

  const labelFor = useCallback(
    (id) => itemIndex.get(id)?.label || itemIndex.get(id)?.labelShort || id,
    [itemIndex],
  );

  const setPlayerPosition = useCallback((position) => {
    playerRef.current = position;
    setPlayer(position);
  }, []);

  const resetRun = useCallback(() => {
    const firstZone = zones[0];
    const startEnemies = makeEnemies(firstZone);
    setZoneIndex(0);
    setPlayerPosition(firstZone.start);
    setHealth(maxHealth);
    setEnergy(100);
    setShield(0);
    setCollected([]);
    setRevealed([]);
    setVisitedZones([firstZone.id]);
    setRevealUntil(0);
    setDashUntil(0);
    setInvulnerableUntil(0);
    setEnemies(startEnemies);
    enemiesRef.current = startEnemies;
    setIntroIndex(level.intro?.length ? 0 : Number.POSITIVE_INFINITY);
    setMessage(level.messages.start);
    wonRef.current = false;
  }, [level.intro?.length, level.messages.start, maxHealth, setPlayerPosition, zones]);

  useEffect(() => {
    resetRun();
  }, [level.id, resetRun]);

  useEffect(() => {
    const startEnemies = makeEnemies(zone);
    setPlayerPosition(zone.start);
    setEnemies(startEnemies);
    enemiesRef.current = startEnemies;
    setRevealUntil(0);
    setDashUntil(0);
    setInvulnerableUntil(Date.now() + 700);
    setMessage(zone.intro || level.messages.start);
    setVisitedZones((current) => (current.includes(zone.id) ? current : [...current, zone.id]));
  }, [level.messages.start, setPlayerPosition, zone]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    shieldRef.current = shield;
  }, [shield]);

  useEffect(() => {
    collectedRef.current = collected;
  }, [collected]);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    mobileDirRef.current = mobileDir;
  }, [mobileDir]);

  const isObstacleOpen = useCallback((obstacle) => {
    if (!obstacle.opensWhen) return false;
    return obstacle.opensWhen.every((id) => collectedRef.current.includes(id));
  }, []);

  const canStandAt = useCallback(
    (position) => {
      const playerRect = makePlayerRect(position);
      if (
        playerRect.x < 0 ||
        playerRect.y < 0 ||
        playerRect.x + playerRect.w > zone.width ||
        playerRect.y + playerRect.h > zone.height
      ) {
        return false;
      }

      return !(zone.obstacles || []).some((obstacle) => !isObstacleOpen(obstacle) && rectsOverlap(playerRect, obstacle));
    },
    [isObstacleOpen, zone],
  );

  const revealSecrets = useCallback(
    (text) => {
      const hiddenIds = (zone.collectibles || []).filter((item) => item.hidden).map((item) => item.id);
      setRevealed((current) => Array.from(new Set([...current, ...hiddenIds])));
      setRevealUntil(Date.now() + 4500);
      setMessage(text || level.messages.abilityPolina || level.messages.abilityAmina);
    },
    [level.messages.abilityAmina, level.messages.abilityPolina, zone.collectibles],
  );

  const useGlasses = useCallback(() => {
    if (storyId !== 'polina' && character === 'yasmina') {
      return;
    }

    const cost = storyId === 'polina' ? 28 : 30;
    if (energy < cost) {
      setMessage(storyId === 'polina' ? 'Очкам Полины нужно чуть больше энергии.' : 'Зоркому взгляду нужно больше энергии.');
      return;
    }

    revealSecrets(storyId === 'polina' ? level.messages.abilityPolina : level.messages.abilityAmina);
    setEnergy((current) => Math.max(0, current - cost));
  }, [character, energy, level.messages.abilityAmina, level.messages.abilityPolina, revealSecrets, storyId]);

  const useDash = useCallback(() => {
    const cost = storyId === 'polina' ? 22 : 30;
    if (energy < cost) {
      setMessage(storyId === 'polina' ? 'На Муха-рывок пока не хватает энергии.' : 'Энергии на рывок пока не хватает.');
      return;
    }

    const dir = lastDirRef.current;
    const start = playerRef.current;
    const distanceToDash = storyId === 'polina' ? 138 : 118;
    let target = start;

    for (let step = 1; step <= 12; step += 1) {
      const candidate = {
        x: clamp(start.x + (dir.x * distanceToDash * step) / 12, playerSize / 2, zone.width - playerSize / 2),
        y: clamp(start.y + (dir.y * distanceToDash * step) / 12, playerSize / 2, zone.height - playerSize / 2),
      };

      if (!canStandAt(candidate)) break;
      target = candidate;
    }

    if (distance(start, target) < 18) {
      setMessage(level.messages.dashBlocked || 'Рывок упёрся в препятствие.');
      return;
    }

    setPlayerPosition(target);
    setDashUntil(Date.now() + 620);
    setInvulnerableUntil(Date.now() + 650);
    setEnergy((current) => Math.max(0, current - cost));
    setMessage(storyId === 'polina' ? level.messages.dashPolina : level.messages.abilityYasmina);
  }, [canStandAt, energy, level.messages.abilityYasmina, level.messages.dashBlocked, level.messages.dashPolina, setPlayerPosition, storyId, zone.height, zone.width]);

  const doAction = useCallback(() => {
    const currentPlayer = playerRef.current;
    const nearestHelper = (zone.helpers || []).find((helper) => distance(currentPlayer, helper) < helperRadius);

    if (!nearestHelper) {
      setMessage(level.messages.actionEmpty);
      return;
    }

    if (nearestHelper.revealHidden) {
      revealSecrets(nearestHelper.message);
    } else {
      setMessage(nearestHelper.message);
    }

    if (nearestHelper.heal) {
      setHealth((current) => Math.min(maxHealth, current + nearestHelper.heal));
    }

    if (nearestHelper.shield) {
      setShield((current) => Math.max(current, nearestHelper.shield));
    }

    if (nearestHelper.energy) {
      setEnergy((current) => Math.min(100, current + nearestHelper.energy));
    }
  }, [level.messages.actionEmpty, maxHealth, revealSecrets, zone.helpers]);

  const isVisibleItem = useCallback(
    (item) => !item.hidden || revealed.includes(item.id) || Date.now() < revealUntil,
    [revealed, revealUntil],
  );

  const advanceIntro = () => {
    const introLength = level.intro?.length || 0;
    if (introIndex < introLength - 1) {
      setIntroIndex((current) => current + 1);
      return;
    }
    setIntroIndex(Number.POSITIVE_INFINITY);
    setMessage(zone.intro || level.messages.start);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      keysRef.current.add(event.code);

      if (event.repeat) return;
      if (event.code === 'Space') {
        if (character === 'yasmina') {
          useDash();
        } else {
          useGlasses();
        }
      }
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'KeyF') {
        useDash();
      }
      if (event.code === 'KeyE') {
        doAction();
      }
    };
    const handleKeyUp = (event) => {
      keysRef.current.delete(event.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [doAction, useDash, useGlasses]);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const moveEnemy = (enemy, dt, currentPlayer) => {
      if (enemy.ai === 'chase' && distance(enemy, currentPlayer) < (enemy.aggro || 220)) {
        const dx = currentPlayer.x - enemy.x;
        const dy = currentPlayer.y - enemy.y;
        const length = Math.hypot(dx, dy) || 1;
        return {
          ...enemy,
          x: clamp(enemy.x + (dx / length) * enemy.speed * dt, enemy.r, zone.width - enemy.r),
          y: clamp(enemy.y + (dy / length) * enemy.speed * dt, enemy.r, zone.height - enemy.r),
        };
      }

      const axis = enemy.axis || 'x';
      const min = axis === 'y' ? enemy.minY ?? enemy.homeY - 110 : enemy.minX ?? enemy.homeX - 110;
      const max = axis === 'y' ? enemy.maxY ?? enemy.homeY + 110 : enemy.maxX ?? enemy.homeX + 110;
      const nextValue = (axis === 'y' ? enemy.y : enemy.x) + enemy.dir * enemy.speed * dt;
      let dir = enemy.dir;
      let value = nextValue;

      if (nextValue < min || nextValue > max) {
        dir *= -1;
        value = clamp(nextValue, min, max);
      }

      return axis === 'y' ? { ...enemy, y: value, dir } : { ...enemy, x: value, dir };
    };

    const transitionTo = (nextZoneId) => {
      if (nextZoneId === 'finish' || zoneIndex >= zones.length - 1) {
        wonRef.current = true;
        setMessage(level.messages.win);
        window.setTimeout(finishActionRun, 700);
        return;
      }

      const nextIndex = zones.findIndex((item) => item.id === nextZoneId);
      if (nextIndex >= 0) {
        transitionCooldownRef.current = Date.now() + 900;
        setZoneIndex(nextIndex);
      }
    };

    const tick = (time) => {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;
      const now = Date.now();

      if (introActive) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const vector = getMoveVector(keysRef.current, mobileDirRef.current);
      const moving = Boolean(vector.x || vector.y);
      if (movingRef.current !== moving) {
        movingRef.current = moving;
        setIsMoving(moving);
      }

      if (moving) {
        lastDirRef.current = vector;
        const current = playerRef.current;
        const slowed = (zone.hazards || []).some(
          (hazard) => hazard.effect === 'slow' && distance(current, hazard) < hazard.r + 18,
        );
        const baseSpeed = zone.playerSpeed || level.playerSpeed || (storyId === 'polina' ? 164 : 178);
        const speed = slowed ? baseSpeed * 0.56 : baseSpeed;

        if (slowed && now > noticeCooldownRef.current) {
          noticeCooldownRef.current = now + 1400;
          setMessage(level.messages.slow || 'Здесь движение замедляется.');
        }

        const nextX = {
          x: clamp(current.x + vector.x * speed * dt, playerSize / 2, zone.width - playerSize / 2),
          y: current.y,
        };
        const afterX = canStandAt(nextX) ? nextX : current;
        const nextY = {
          x: afterX.x,
          y: clamp(afterX.y + vector.y * speed * dt, playerSize / 2, zone.height - playerSize / 2),
        };
        setPlayerPosition(canStandAt(nextY) ? nextY : afterX);
      }

      setEnergy((current) => Math.min(100, current + dt * 5.4));

      setEnemies((currentEnemies) => {
        const nextEnemies = currentEnemies.map((enemy) => moveEnemy(enemy, dt, playerRef.current));
        enemiesRef.current = nextEnemies;
        return nextEnemies;
      });

      const currentPlayer = playerRef.current;
      const itemToCollect = (zone.collectibles || []).find(
        (item) =>
          !collectedRef.current.includes(item.id) &&
          (!item.hidden || revealedRef.current.includes(item.id) || revealUntil > now) &&
          distance(currentPlayer, item) < itemRadius,
      );

      if (itemToCollect) {
        setCollected((current) => (current.includes(itemToCollect.id) ? current : [...current, itemToCollect.id]));
        setEnergy((current) => Math.min(100, current + (itemToCollect.energy || 12)));
        setMessage(itemToCollect.message || `${itemToCollect.label} найдено.`);
      }

      const touchedHazard = (zone.hazards || []).some(
        (hazard) => hazard.effect !== 'slow' && distance(currentPlayer, hazard) < hazard.r + 13,
      );
      const touchedEnemy = enemiesRef.current.some((enemy) => distance(currentPlayer, enemy) < enemy.r + 14);

      if ((touchedHazard || touchedEnemy) && now > damageCooldownRef.current && now > invulnerableUntil) {
        damageCooldownRef.current = now + 920;
        if (shieldRef.current > 0) {
          setShield((current) => Math.max(0, current - 1));
          setMessage(level.messages.shield);
        } else {
          setHealth((current) => {
            if (current <= 1) {
              window.setTimeout(resetRun, 260);
              return 0;
            }
            return current - 1;
          });
          setMessage(level.messages.hurt);
        }
      }

      if (zone.exit && now > transitionCooldownRef.current) {
        const missingForExit = (zone.requiredForExit || level.requiredIds).filter(
          (id) => !collectedRef.current.includes(id),
        );
        const exitCenter = {
          x: zone.exit.x + zone.exit.w / 2,
          y: zone.exit.y + zone.exit.h / 2,
        };

        if (pointInRect(currentPlayer, zone.exit)) {
          if (missingForExit.length === 0) {
            transitionTo(zone.nextZoneId);
          } else if (now > noticeCooldownRef.current) {
            noticeCooldownRef.current = now + 1200;
            setMessage(`${zone.lockedMessage || 'Проход пока закрыт'} Не хватает: ${missingForExit.map(labelFor).join(', ')}.`);
          }
        } else if (distance(currentPlayer, exitCenter) < 138 && now > noticeCooldownRef.current) {
          noticeCooldownRef.current = now + 1600;
          setMessage(
            missingForExit.length === 0
              ? zone.nextZoneId === 'finish'
                ? 'Свет Старой Яблони открыт. Войди в круг у корней.'
                : 'Проход открыт. Можно идти дальше.'
              : zone.lockedMessage || level.messages.ready,
          );
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [
    canStandAt,
    finishActionRun,
    introActive,
    invulnerableUntil,
    labelFor,
    level.messages.hurt,
    level.messages.ready,
    level.messages.shield,
    level.messages.slow,
    level.messages.win,
    level.playerSpeed,
    level.requiredIds,
    resetRun,
    revealUntil,
    setPlayerPosition,
    storyId,
    zone,
    zoneIndex,
    zones,
  ]);

  const stopMobileMove = () => setMobileDir({ x: 0, y: 0 });
  const keyStatus = level.keyParts || level.requiredIds.map((id) => ({ id, label: labelFor(id), icon: labelFor(id).slice(0, 1) }));
  const controlHint =
    storyId === 'polina'
      ? 'WASD/стрелки — движение · Пробел — Очки Полины · Shift/F — Муха-рывок · E — действие'
      : 'WASD/стрелки — движение · Пробел — способность · Shift/F — рывок · E — действие';
  const objectiveText = zoneMissing.length
    ? zone.goal
    : zone.nextZoneId === 'finish'
      ? 'Войди в свет Старой Яблони и заверши пробуждение.'
      : 'Проход открыт. Найди выход в следующую зону.';

  return (
    <main className={`action-screen action-${level.theme} action-zone-${zone.theme}`}>
      <div className="action-topbar">
        <div>
          <p className="eyebrow">{currentStory.title}</p>
          <h1>{zone.title}</h1>
        </div>
        <div className="action-topbar-buttons">
          <button className="secondary-button" type="button" onClick={resetRun}>
            Рестарт
          </button>
          <button className="secondary-button" type="button" onClick={restartStory}>
            Выбор героя
          </button>
          <SoundToggle />
        </div>
      </div>

      <section className="action-goal" aria-label="Текущая цель">
        <div>
          <p className="eyebrow">Текущая цель</p>
          <strong>{objectiveText}</strong>
          <span>{zone.hint || level.goalText}</span>
        </div>
        <div className="key-ring" aria-label="Части ключа">
          {keyStatus.map((part) => (
            <span className={collected.includes(part.id) ? 'is-found' : ''} key={part.id}>
              {part.icon}
              <small>{part.label}</small>
            </span>
          ))}
        </div>
        <div className="zone-progress" aria-label="Прогресс по зонам">
          {zones.map((item, index) => (
            <span className={`${index === zoneIndex ? 'is-current' : ''} ${visitedZones.includes(item.id) ? 'is-visited' : ''}`} key={item.id}>
              {item.shortTitle || item.title}
            </span>
          ))}
        </div>
      </section>

      <section className="action-hud" aria-label="Состояние забега">
        <span>Героиня: {hero.name}</span>
        <span>Здоровье: {'♥'.repeat(Math.max(0, health))}</span>
        <span className="energy-meter">
          Энергия
          <i style={{ width: `${Math.round(energy)}%` }} />
          <b>{Math.round(energy)}%</b>
        </span>
        <span>
          Ключ: {collectedCount}/{requiredCount}
        </span>
        {rootLightCount > 0 && <span>Искры: {rootLightCount}/3</span>}
        {shield > 0 && <span>Кошачий щит</span>}
      </section>

      <section className="action-map-wrap">
        <div
          className={`action-map map-${zone.theme} ${revealActive ? 'is-revealing' : ''}`}
          style={{ '--map-ratio': `${zone.width} / ${zone.height}` }}
        >
          {(zone.paths || []).map((path) => (
            <div
              className={`map-path path-${path.kind || 'path'}`}
              key={path.id}
              style={{ left: sx(path.x), top: sy(path.y), width: sx(path.w), height: sy(path.h) }}
            />
          ))}

          {(zone.decorations || []).map((decoration) => (
            <div
              className={`map-decor decor-${decoration.kind}`}
              key={decoration.id}
              style={{
                left: sx(decoration.x),
                top: sy(decoration.y),
                width: sx(decoration.w),
                height: sy(decoration.h),
              }}
              aria-hidden="true"
            />
          ))}

          <div
            className={`exit-zone ${zoneMissing.length === 0 ? 'is-open' : 'is-locked'}`}
            data-exit-zone="true"
            style={{
              left: sx(zone.exit.x),
              top: sy(zone.exit.y),
              width: sx(zone.exit.w),
              height: sy(zone.exit.h),
            }}
          >
            {zone.exit.label}
          </div>

          {(zone.obstacles || []).map((obstacle) => (
            <div
              className={`map-obstacle obstacle-${obstacle.kind || 'solid'} ${isObstacleOpen(obstacle) ? 'is-open' : ''}`}
              data-obstacle-id={obstacle.id}
              key={obstacle.id}
              style={{
                left: sx(obstacle.x),
                top: sy(obstacle.y),
                width: sx(obstacle.w),
                height: sy(obstacle.h),
              }}
            >
              {obstacle.label}
            </div>
          ))}

          {(zone.hazards || []).map((hazard) => (
            <div
              className={`map-hazard hazard-${hazard.type} ${hazard.effect === 'slow' ? 'is-slow' : ''}`}
              data-hazard-id={hazard.id}
              key={hazard.id}
              style={{
                left: sx(hazard.x - hazard.r),
                top: sy(hazard.y - hazard.r),
                width: sx(hazard.r * 2),
                height: sy(hazard.r * 2),
              }}
            >
              {hazard.label}
            </div>
          ))}

          {enemies.map((enemy) => (
            <div
              className={`map-enemy enemy-${enemy.type || 'wisp'} ${enemy.ai === 'chase' ? 'is-chaser' : ''}`}
              data-enemy-id={enemy.id}
              key={enemy.id}
              style={{
                left: sx(enemy.x - enemy.r),
                top: sy(enemy.y - enemy.r),
                width: sx(enemy.r * 2),
                height: sy(enemy.r * 2),
              }}
            >
              {enemy.label}
            </div>
          ))}

          {(zone.helpers || []).map((helper) => (
            <div
              className={`map-helper helper-${helper.type}`}
              data-helper-id={helper.id}
              key={helper.id}
              style={{ left: sx(helper.x), top: sy(helper.y) }}
            >
              {helper.label}
            </div>
          ))}

          {(zone.collectibles || []).map((item) => {
            const collectedItem = collected.includes(item.id);
            const visible = isVisibleItem(item);
            return (
              <div
                className={`map-item item-${item.type} ${collectedItem ? 'is-collected' : ''} ${
                  visible ? 'is-visible' : 'is-hidden'
                }`}
                data-item-id={item.id}
                key={item.id}
                style={{ left: sx(item.x), top: sy(item.y) }}
              >
                <span className="item-icon">{getItemIcon(item)}</span>
                <span className="item-label">{item.label}</span>
              </div>
            );
          })}

          <div
            className={`map-player player-${character || 'hero'} ${shield > 0 ? 'has-shield' : ''} ${
              revealActive || dashActive ? 'ability-active' : ''
            } ${dashActive ? 'dash-active' : ''} ${isMoving ? 'is-moving' : ''}`}
            data-player="true"
            style={{ left: sx(player.x), top: sy(player.y) }}
          >
            <CharacterSprite characterId={character} name={hero.name} />
          </div>
        </div>
      </section>

      <section className="action-bottom">
        <p>{message}</p>
        <p className="control-hint">{controlHint}</p>
      </section>

      <section className="mobile-controls" aria-label="Управление на телефоне">
        <div className="mobile-stick">
          <button type="button" aria-label="Вверх" onPointerDown={() => setMobileDir({ x: 0, y: -1 })} onPointerUp={stopMobileMove} onPointerCancel={stopMobileMove}>
            ▲
          </button>
          <button type="button" aria-label="Влево" onPointerDown={() => setMobileDir({ x: -1, y: 0 })} onPointerUp={stopMobileMove} onPointerCancel={stopMobileMove}>
            ◀
          </button>
          <button type="button" aria-label="Вправо" onPointerDown={() => setMobileDir({ x: 1, y: 0 })} onPointerUp={stopMobileMove} onPointerCancel={stopMobileMove}>
            ▶
          </button>
          <button type="button" aria-label="Вниз" onPointerDown={() => setMobileDir({ x: 0, y: 1 })} onPointerUp={stopMobileMove} onPointerCancel={stopMobileMove}>
            ▼
          </button>
        </div>
        <div className="mobile-action-buttons">
          <button type="button" onClick={useGlasses}>
            Очки
          </button>
          <button type="button" onClick={useDash}>
            Рывок
          </button>
          <button type="button" onClick={doAction}>
            Действие
          </button>
        </div>
      </section>

      {introActive && (
        <div className="action-intro-backdrop">
          <section className="action-intro" role="dialog" aria-modal="true" aria-label="Вступление">
            <p className="eyebrow">{currentIntro.kicker}</p>
            <h2>{currentIntro.title}</h2>
            <p>{currentIntro.text}</p>
            <button className="primary-button" type="button" onClick={advanceIntro}>
              {introIndex < (level.intro?.length || 0) - 1 ? 'Дальше' : 'Войти в сад'}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
