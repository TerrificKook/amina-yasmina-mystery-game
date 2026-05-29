import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { actionLevels } from '../../data/actionLevels.js';
import { useGame } from '../../context/GameContext.jsx';
import SoundToggle from '../ui/SoundToggle.jsx';

const playerSize = 30;
const itemRadius = 25;
const helperRadius = 58;

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

export default function ActionGameScreen() {
  const { storyId, character, currentStory, finishActionRun, restartStory } = useGame();
  const level = actionLevels[storyId] || actionLevels['amina-yasmina'];
  const hero = currentStory.characters[character] || Object.values(currentStory.characters)[0];
  const [player, setPlayer] = useState(level.start);
  const [health, setHealth] = useState(3);
  const [energy, setEnergy] = useState(100);
  const [shield, setShield] = useState(0);
  const [collected, setCollected] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [message, setMessage] = useState(level.messages.start);
  const [mobileDir, setMobileDir] = useState({ x: 0, y: 0 });
  const [revealUntil, setRevealUntil] = useState(0);
  const [boostUntil, setBoostUntil] = useState(0);
  const [invulnerableUntil, setInvulnerableUntil] = useState(0);
  const [enemies, setEnemies] = useState(() => level.enemies.map((enemy) => ({ ...enemy, dir: 1 })));

  const keysRef = useRef(new Set());
  const playerRef = useRef(player);
  const shieldRef = useRef(shield);
  const collectedRef = useRef(collected);
  const revealedRef = useRef(revealed);
  const enemiesRef = useRef(enemies);
  const mobileDirRef = useRef(mobileDir);
  const lastDirRef = useRef({ x: 1, y: 0 });
  const damageCooldownRef = useRef(0);
  const wonRef = useRef(false);

  const requiredCount = level.requiredIds.length;
  const collectedCount = useMemo(
    () => level.requiredIds.filter((id) => collected.includes(id)).length,
    [collected, level.requiredIds],
  );
  const sx = useCallback((value) => `${(value / level.width) * 100}%`, [level.width]);
  const sy = useCallback((value) => `${(value / level.height) * 100}%`, [level.height]);
  const revealActive = Date.now() < revealUntil;
  const boostActive = Date.now() < boostUntil;

  useEffect(() => {
    const startEnemies = level.enemies.map((enemy) => ({ ...enemy, dir: 1 }));
    setPlayer(level.start);
    setHealth(3);
    setEnergy(100);
    setShield(0);
    setCollected([]);
    setRevealed([]);
    setMessage(level.messages.start);
    setRevealUntil(0);
    setBoostUntil(0);
    setInvulnerableUntil(0);
    setEnemies(startEnemies);
    enemiesRef.current = startEnemies;
    wonRef.current = false;
  }, [level]);

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

  const canStandAt = useCallback(
    (position) => {
      const playerRect = makePlayerRect(position);
      if (
        playerRect.x < 0 ||
        playerRect.y < 0 ||
        playerRect.x + playerRect.w > level.width ||
        playerRect.y + playerRect.h > level.height
      ) {
        return false;
      }
      return !level.obstacles.some((obstacle) => rectsOverlap(playerRect, obstacle));
    },
    [level],
  );

  const resetRun = useCallback(() => {
    const startEnemies = level.enemies.map((enemy) => ({ ...enemy, dir: 1 }));
    setPlayer(level.start);
    setHealth(3);
    setEnergy(100);
    setShield(0);
    setCollected([]);
    setRevealed([]);
    setRevealUntil(0);
    setBoostUntil(0);
    setInvulnerableUntil(0);
    setEnemies(startEnemies);
    enemiesRef.current = startEnemies;
    setMessage('Забег начался заново. Главное — не спешить в колючки.');
    wonRef.current = false;
  }, [level]);

  const revealSecrets = useCallback(
    (text) => {
      setRevealed(level.collectibles.filter((item) => item.hidden).map((item) => item.id));
      setRevealUntil(Date.now() + 3600);
      setMessage(text);
    },
    [level.collectibles],
  );

  const useAbility = useCallback(() => {
    if (character === 'yasmina') {
      if (energy < 30) {
        setMessage('Энергии на рывок пока не хватает.');
        return;
      }

      const dir = lastDirRef.current;
      const start = playerRef.current;
      const target = {
        x: clamp(start.x + dir.x * 118, playerSize / 2, level.width - playerSize / 2),
        y: clamp(start.y + dir.y * 118, playerSize / 2, level.height - playerSize / 2),
      };

      if (!canStandAt(target)) {
        setMessage('Рывок упёрся в препятствие.');
        return;
      }

      setPlayer(target);
      setInvulnerableUntil(Date.now() + 700);
      setEnergy((current) => Math.max(0, current - 30));
      setMessage(level.messages.abilityYasmina);
      return;
    }

    if (storyId === 'polina') {
      if (energy < 35) {
        setMessage('Очкам Полины нужно чуть больше энергии.');
        return;
      }
      revealSecrets(level.messages.abilityPolina);
      setBoostUntil(Date.now() + 3200);
      setEnergy((current) => Math.max(0, current - 35));
      return;
    }

    if (energy < 30) {
      setMessage('Зоркому взгляду нужно чуть больше энергии.');
      return;
    }
    revealSecrets(level.messages.abilityAmina);
    setEnergy((current) => Math.max(0, current - 30));
  }, [canStandAt, character, energy, level, revealSecrets, storyId]);

  const doAction = useCallback(() => {
    const currentPlayer = playerRef.current;
    const nearestHelper = level.helpers.find((helper) => distance(currentPlayer, helper) < helperRadius);

    if (!nearestHelper) {
      setMessage(level.messages.actionEmpty);
      return;
    }

    if (nearestHelper.type === 'shield') {
      setShield(1);
      setMessage(nearestHelper.message);
      return;
    }

    if (nearestHelper.type === 'teffi' || nearestHelper.type === 'rhythm') {
      revealSecrets(nearestHelper.message);
      return;
    }

    if (nearestHelper.type === 'heal') {
      setHealth(3);
      setShield(1);
      setMessage(nearestHelper.message);
    }
  }, [level.helpers, level.messages.actionEmpty, revealSecrets]);

  const isVisibleItem = useCallback(
    (item) => !item.hidden || revealed.includes(item.id) || Date.now() < revealUntil,
    [revealed, revealUntil],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      keysRef.current.add(event.code);
      if (event.code === 'Space') {
        useAbility();
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
  }, [doAction, useAbility]);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const tick = (time) => {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;
      const now = Date.now();
      const vector = getMoveVector(keysRef.current, mobileDirRef.current);

      if (vector.x || vector.y) {
        lastDirRef.current = vector;
        const speed = boostUntil > now ? 238 : 178;
        const current = playerRef.current;
        const nextX = {
          x: clamp(current.x + vector.x * speed * dt, playerSize / 2, level.width - playerSize / 2),
          y: current.y,
        };
        const afterX = canStandAt(nextX) ? nextX : current;
        const nextY = {
          x: afterX.x,
          y: clamp(afterX.y + vector.y * speed * dt, playerSize / 2, level.height - playerSize / 2),
        };
        setPlayer(canStandAt(nextY) ? nextY : afterX);
      }

      setEnergy((current) => Math.min(100, current + dt * 7));

      setEnemies((currentEnemies) => {
        const nextEnemies = currentEnemies.map((enemy) => {
          let x = enemy.x + enemy.dir * enemy.speed * dt;
          let dir = enemy.dir;
          if (x < enemy.minX || x > enemy.maxX) {
            dir *= -1;
            x = clamp(x, enemy.minX, enemy.maxX);
          }
          return { ...enemy, x, dir };
        });
        enemiesRef.current = nextEnemies;
        return nextEnemies;
      });

      const currentPlayer = playerRef.current;
      const itemToCollect = level.collectibles.find(
        (item) =>
          !collectedRef.current.includes(item.id) &&
          (!item.hidden || revealedRef.current.includes(item.id) || revealUntil > now) &&
          distance(currentPlayer, item) < itemRadius,
      );

      if (itemToCollect) {
        setCollected((current) => (current.includes(itemToCollect.id) ? current : [...current, itemToCollect.id]));
        setEnergy((current) => Math.min(100, current + 18));
        setMessage(`${itemToCollect.label} найдено!`);
      }

      const touchedHazard =
        level.hazards.some((hazard) => distance(currentPlayer, hazard) < hazard.r + 12) ||
        enemiesRef.current.some((enemy) => distance(currentPlayer, enemy) < enemy.r + 12);

      if (touchedHazard && now > damageCooldownRef.current && now > invulnerableUntil) {
        damageCooldownRef.current = now + 900;
        if (shieldRef.current > 0) {
          setShield((current) => Math.max(0, current - 1));
          setMessage(level.messages.shield);
        } else {
          setHealth((current) => {
            if (current <= 1) {
              window.setTimeout(resetRun, 80);
              return 0;
            }
            return current - 1;
          });
          setMessage(level.messages.hurt);
        }
      }

      const hasEverything = level.requiredIds.every((id) => collectedRef.current.includes(id));
      if (hasEverything && pointInRect(currentPlayer, level.exit) && !wonRef.current) {
        wonRef.current = true;
        setMessage(level.messages.win);
        window.setTimeout(finishActionRun, 700);
      } else if (hasEverything && distance(currentPlayer, level.exit) < 150) {
        setMessage(level.messages.ready);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [boostUntil, canStandAt, finishActionRun, invulnerableUntil, level, resetRun, revealUntil]);

  return (
    <main className={`action-screen action-${level.theme}`}>
      <div className="action-topbar">
        <div>
          <p className="eyebrow">{currentStory.title}</p>
          <h1>{level.title}</h1>
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

      <section className="action-hud" aria-label="Состояние забега">
        <span>Герой: {hero.name}</span>
        <span>Здоровье: {'♥'.repeat(Math.max(0, health))}</span>
        <span>Энергия: {Math.round(energy)}%</span>
        <span>
          Собрано: {collectedCount}/{requiredCount}
        </span>
        {shield > 0 && <span>Щит Скиппи</span>}
      </section>

      <section className="action-map-wrap">
        <div className="action-map">
          <div
            className="exit-zone"
            data-exit-zone="true"
            style={{
              left: sx(level.exit.x),
              top: sy(level.exit.y),
              width: sx(level.exit.w),
              height: sy(level.exit.h),
            }}
          >
            {level.exit.label}
          </div>

          {level.obstacles.map((obstacle) => (
            <div
              className="map-obstacle"
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

          {level.hazards.map((hazard) => (
            <div
              className="map-hazard"
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
              className="map-enemy"
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

          {level.helpers.map((helper) => (
            <div
              className={`map-helper helper-${helper.type}`}
              data-helper-id={helper.id}
              key={helper.id}
              style={{ left: sx(helper.x), top: sy(helper.y) }}
            >
              {helper.label}
            </div>
          ))}

          {level.collectibles.map((item) => {
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
                {item.label}
              </div>
            );
          })}

          <div
            className={`map-player player-${character || 'hero'} ${shield > 0 ? 'has-shield' : ''} ${
              revealActive || boostActive ? 'ability-active' : ''
            }`}
            data-player="true"
            style={{ left: sx(player.x), top: sy(player.y) }}
          >
            {hero.name.slice(0, 1)}
          </div>
        </div>
      </section>

      <section className="action-bottom">
        <p>{message}</p>
        <p className="control-hint">Движение: WASD/стрелки · Способность: пробел · Действие рядом с помощником: E</p>
      </section>

      <section className="mobile-controls" aria-label="Управление на телефоне">
        <div className="mobile-stick">
          <button type="button" aria-label="Вверх" onPointerDown={() => setMobileDir({ x: 0, y: -1 })} onPointerUp={() => setMobileDir({ x: 0, y: 0 })}>
            ▲
          </button>
          <button type="button" aria-label="Влево" onPointerDown={() => setMobileDir({ x: -1, y: 0 })} onPointerUp={() => setMobileDir({ x: 0, y: 0 })}>
            ◀
          </button>
          <button type="button" aria-label="Вправо" onPointerDown={() => setMobileDir({ x: 1, y: 0 })} onPointerUp={() => setMobileDir({ x: 0, y: 0 })}>
            ▶
          </button>
          <button type="button" aria-label="Вниз" onPointerDown={() => setMobileDir({ x: 0, y: 1 })} onPointerUp={() => setMobileDir({ x: 0, y: 0 })}>
            ▼
          </button>
        </div>
        <div className="mobile-action-buttons">
          <button type="button" onClick={useAbility}>
            Способность
          </button>
          <button type="button" onClick={doAction}>
            Действие
          </button>
        </div>
      </section>
    </main>
  );
}
