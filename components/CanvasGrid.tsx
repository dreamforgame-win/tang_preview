'use client';
import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  scale: number;
  z: number;
}

export default function CanvasGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      // 动态获取画布尺寸，处理高分屏模糊问题
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // 避免不必要的重绘
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      
      ctx.save();
      ctx.scale(dpr, dpr);
      
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // 透视投影 (Perspective Projection) 核心参数
      // ==========================================
      const D = 800; // 视距 (Focal Length)
      const Z_base = 600; // 基础高度 Z (相机到棋盘中心的距离)

      const cellSize = 68; // 缩小 15%
      const gap = 10;
      const totalSize = cellSize + gap;

      // 透视投影算法核心函数
      const project = (lx: number, ly: number): Point3D => {
        // 绕 X 轴旋转 (透视俯视角)
        const rx = 60 * Math.PI / 180; 
        
        // ly 为正表示远处，ly 为负表示近处
        const y_rot = ly * Math.cos(rx);
        const z_rot = ly * Math.sin(rx);

        // 加上基础距离 Z (将棋盘推远)
        const z_trans = z_rot + Z_base;

        // 透视投影计算 (x, y)
        // 远处的点 z_trans 更大，scale 更小，从而实现近大远小
        const scale = D / z_trans;
        const px = lx * scale + width / 2;
        
        // Canvas 的 Y 轴是向下的，所以减去 y_rot * scale 让远处的点靠上
        const py = height / 2 - y_rot * scale - 15; // 上移居中

        return { x: px, y: py, scale, z: z_trans };
      };

      // 绘制 3x3 网格
      // 为了让近处的格子覆盖远处的格子（如果有重叠或发光效果），我们从远到近绘制
      // row = 2 是远处 (ly > 0)，row = 0 是近处 (ly < 0)
      for (let row = 2; row >= 0; row--) {
        for (let col = 0; col < 3; col++) {
          // 以网格中心为原点 (0,0)
          const cx = (col - 1) * totalSize;
          const cy = (row - 1) * totalSize;

          // 计算当前格子的四个顶点 (局部 2D 坐标)
          const vertices = [
            { x: cx - cellSize / 2, y: cy + cellSize / 2 }, // 远左 (Top Left in 2D)
            { x: cx + cellSize / 2, y: cy + cellSize / 2 }, // 远右 (Top Right in 2D)
            { x: cx + cellSize / 2, y: cy - cellSize / 2 }, // 近右 (Bottom Right in 2D)
            { x: cx - cellSize / 2, y: cy - cellSize / 2 }, // 近左 (Bottom Left in 2D)
          ];

          // 将四个顶点投影到屏幕坐标
          const projectedVertices = vertices.map(v => project(v.x, v.y));
          const projectedCenter = project(cx, cy);

          // 绘制多边形
          ctx.beginPath();
          ctx.moveTo(projectedVertices[0].x, projectedVertices[0].y);
          for (let i = 1; i < 4; i++) {
            ctx.lineTo(projectedVertices[i].x, projectedVertices[i].y);
          }
          ctx.closePath();

          // 样式设置：利用 scale 实现远处的格子更暗、线条更细
          ctx.fillStyle = `rgba(26, 26, 26, ${0.05 * projectedCenter.scale})`; // 淡墨填充
          ctx.fill();
          
          ctx.lineWidth = 1.5 * projectedCenter.scale;
          ctx.strokeStyle = `rgba(26, 26, 26, ${0.4 * projectedCenter.scale})`; // 浓墨线条
          ctx.stroke();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
