"use client";

import React, { useRef, useImperativeHandle, forwardRef, useEffect } from "react";

export type EffectTheme = "congrats" | "love" | "cheer" | "thanks";

export interface EmojiParticleCanvasRef {
  trigger: (theme: EffectTheme) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "star" | "heart" | "petal";
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  decay: number;
  gravity: number;
  wind?: number;
  windSpeed?: number;
}

const EmojiParticleCanvas = forwardRef<EmojiParticleCanvasRef, {}>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const activeLoopRef = useRef<boolean>(false);

  // Canvas Size Responsive Auto Update
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 1. Particle Drawing Shapes Utility
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 2, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
    ctx.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size / 2, y + size);
    ctx.quadraticCurveTo(x, y + (size * 2) / 3, x, y + size / 3);
    ctx.quadraticCurveTo(x, y, x, y + size / 4);
    ctx.closePath();
    ctx.fill();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  const drawPetal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.ellipse(x, y, size, size / 2, Math.PI / 4, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  };

  // 2. Physics & Particle Simulation Loop
  const updateAndDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    
    // Low performance defense: check if all particles are dead
    if (particles.length === 0) {
      activeLoopRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    particlesRef.current = particles.filter((p) => {
      // Apply Physics Formulas
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      // Special wind effect for falling petals (thanks theme)
      if (p.shape === "petal" && p.wind !== undefined && p.windSpeed !== undefined) {
        p.wind += p.windSpeed;
        p.x += Math.sin(p.wind) * 0.7;
      }

      if (p.alpha <= 0 || p.x < -100 || p.x > canvas.width + 100 || p.y > canvas.height + 100) {
        return false; // Filter out dead particles
      }

      // Draw Particle with exact transformations
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, 2 * Math.PI);
        ctx.fill();
      } else if (p.shape === "square") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === "heart") {
        drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
      } else if (p.shape === "star") {
        drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
      } else if (p.shape === "petal") {
        drawPetal(ctx, 0, 0, p.size);
      }

      ctx.restore();
      return true;
    });

    animationFrameRef.current = requestAnimationFrame(updateAndDraw);
  };

  // Start animation loop only if inactive
  const ensureAnimationLoop = () => {
    if (!activeLoopRef.current) {
      activeLoopRef.current = true;
      animationFrameRef.current = requestAnimationFrame(updateAndDraw);
    }
  };

  // 3. Parent Imperative Ref Handle (Trigger Methods)
  useImperativeHandle(ref, () => ({
    trigger: (theme: EffectTheme) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      const newParticles: Particle[] = [];

      // Palettes by theme
      const congratsColors = ["#FF5252", "#FFEB3B", "#4CAF50", "#2196F3", "#9C27B0", "#FF9800", "#E91E63", "#00BCD4"];
      const loveColors = ["#FF2A6D", "#FF6289", "#FD0A54", "#F57576", "#FF85A2", "#E91E63"];
      const cheerColors = ["#FFDF00", "#FFD700", "#FFC61A", "#FFE57F", "#FFB300", "#FFA000"];
      const thanksColors = ["#FFA07A", "#FF7F50", "#FFD700", "#20B2AA", "#3CB371", "#FFC0CB"];

      if (theme === "congrats") {
        // 무지개 오색 폭죽 이펙트: 화면 하단 양쪽 구석에서 각각 하늘 위 방향으로 뿜어져 나옴
        const countPerSide = 50;

        // Left Confetti Shooter
        for (let i = 0; i < countPerSide; i++) {
          const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.4; // around -45 deg
          const speed = 14 + Math.random() * 12;
          newParticles.push({
            x: 0,
            y: h,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 8,
            color: congratsColors[Math.floor(Math.random() * congratsColors.length)],
            shape: "square",
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            alpha: 1.0,
            decay: 0.01 + Math.random() * 0.008,
            gravity: 0.22,
          });
        }

        // Right Confetti Shooter
        for (let i = 0; i < countPerSide; i++) {
          const angle = (-Math.PI * 3) / 4 + (Math.random() - 0.5) * 0.4; // around -135 deg
          const speed = 14 + Math.random() * 12;
          newParticles.push({
            x: w,
            y: h,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 8,
            color: congratsColors[Math.floor(Math.random() * congratsColors.length)],
            shape: "square",
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            alpha: 1.0,
            decay: 0.01 + Math.random() * 0.008,
            gravity: 0.22,
          });
        }
      } else if (theme === "love") {
        // 중앙에서 솟구치는 하트 팡팡
        const heartCount = 60;
        for (let i = 0; i < heartCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 7;
          newParticles.push({
            x: w / 2,
            y: h / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5, // slightly upward biased
            size: 10 + Math.random() * 15,
            color: loveColors[Math.floor(Math.random() * loveColors.length)],
            shape: "heart",
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 6,
            alpha: 1.0,
            decay: 0.012 + Math.random() * 0.008,
            gravity: 0.05,
          });
        }
      } else if (theme === "cheer") {
        // 골드 스타 밤하늘 폭발
        const starCount = 65;
        for (let i = 0; i < starCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 4 + Math.random() * 12;
          newParticles.push({
            x: w / 2 + (Math.random() - 0.5) * 40,
            y: h / 2 - 50 + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 8 + Math.random() * 14,
            color: cheerColors[Math.floor(Math.random() * cheerColors.length)],
            shape: "star",
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 20,
            alpha: 1.0,
            decay: 0.015 + Math.random() * 0.01,
            gravity: 0.12,
          });
        }
      } else if (theme === "thanks") {
        // 화면 전체 상단에서 살랑거리며 낙하하는 따뜻한 꽃잎 비
        const petalCount = 45;
        for (let i = 0; i < petalCount; i++) {
          newParticles.push({
            x: Math.random() * w,
            y: -20 - Math.random() * 80,
            vx: -1 + Math.random() * 2, // slightly drift left/right
            vy: 1.5 + Math.random() * 2.5,
            size: 8 + Math.random() * 8,
            color: thanksColors[Math.floor(Math.random() * thanksColors.length)],
            shape: "petal",
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 4,
            alpha: 1.0,
            decay: 0.005 + Math.random() * 0.004,
            gravity: 0.02,
            wind: Math.random() * 100,
            windSpeed: 0.01 + Math.random() * 0.03,
          });
        }
      }

      // Add to particle queue
      particlesRef.current = [...particlesRef.current, ...newParticles];
      ensureAnimationLoop();
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] w-full h-full block"
      style={{ mixBlendMode: "screen" }}
    />
  );
});

EmojiParticleCanvas.displayName = "EmojiParticleCanvas";

export default EmojiParticleCanvas;
