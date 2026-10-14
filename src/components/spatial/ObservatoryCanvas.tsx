import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { useUniverse } from '../../context/UniverseContext';
import { EnrichedClient } from '../../types/schema';
import { ExternalLink, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';

interface ObservatoryCanvasProps {
  clients: EnrichedClient[];
  onSelectClient?: (client: EnrichedClient) => void;
}

export const ObservatoryCanvas: React.FC<ObservatoryCanvasProps> = ({ clients, onSelectClient }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { selectedClient, setSelectedClient, setActiveTab } = useUniverse();
  const [hoveredClient, setHoveredClient] = useState<EnrichedClient | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const clientNodesMap = useRef<Map<string, { mesh: THREE.Mesh; halo: THREE.Mesh; client: EnrichedClient }>>(new Map());

  const targetCameraPos = useRef(new THREE.Vector3(0, 16, 42));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 16, 42);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Groups
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);
    coreGroupRef.current = coreGroup;

    const ringsGroup = new THREE.Group();
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    nodesGroupRef.current = nodesGroup;

    // Lighting adjusted for high legibility
    const isDark = theme === 'og';
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 1.2);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.0 : 1.5);
    dirLight.position.set(20, 40, 25);
    dirLight.name = 'dirLight';
    scene.add(dirLight);

    // Subtle central anchor (Silo Core)
    const coreGeo = new THREE.IcosahedronGeometry(2.0, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x00f0ff : 0x0284c7,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.name = 'coreMesh';
    coreGroup.add(coreMesh);

    // Clean, faint orbital guide rings
    const ringRadii = [10, 17, 24, 30];
    ringRadii.forEach((r) => {
      const ringGeo = new THREE.RingGeometry(r - 0.04, r + 0.04, 72);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0284c7,
        opacity: isDark ? 0.15 : 0.2,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ringsGroup.add(ring);
    });

    // Raycaster for user clicking/hovering nodes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(clientNodesMap.current.values()).map(v => v.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const entry = Array.from(clientNodesMap.current.values()).find(e => e.mesh === hitMesh);
        if (entry) {
          setHoveredClient(entry.client);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredClient(null);
      container.style.cursor = 'default';
    };

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(clientNodesMap.current.values()).map(v => v.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const entry = Array.from(clientNodesMap.current.values()).find(e => e.mesh === hitMesh);
        if (entry) {
          setSelectedClient(entry.client);
          if (onSelectClient) {
            onSelectClient(entry.client);
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle, quiet rotation
      if (coreGroupRef.current) {
        coreGroupRef.current.rotation.y = elapsedTime * 0.05;
      }

      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, 0.05);
        currentLookAt.current.lerp(targetLookAt.current, 0.05);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Subtle pulse on active selection
      clientNodesMap.current.forEach(({ halo, client }) => {
        const isSelected = selectedClient?.clientId === client.clientId;
        if (isSelected) {
          const scale = 1.3 + Math.sin(elapsedTime * 3) * 0.1;
          halo.scale.set(scale, scale, scale);
        } else {
          halo.scale.set(1, 1, 1);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync theme
  useEffect(() => {
    if (!sceneRef.current) return;
    const isDark = theme === 'og';
    const ambientLight = sceneRef.current.getObjectByName('ambientLight') as THREE.AmbientLight;
    if (ambientLight) {
      ambientLight.intensity = isDark ? 0.7 : 1.2;
    }
    const coreMesh = sceneRef.current.getObjectByName('coreMesh') as THREE.Mesh;
    if (coreMesh && coreMesh.material instanceof THREE.MeshStandardMaterial) {
      coreMesh.material.color.setHex(isDark ? 0x00f0ff : 0x0284c7);
    }
  }, [theme]);

  // Populate client nodes
  useEffect(() => {
    if (!nodesGroupRef.current) return;
    const nodesGroup = nodesGroupRef.current;

    while (nodesGroup.children.length > 0) {
      nodesGroup.remove(nodesGroup.children[0]);
    }
    clientNodesMap.current.clear();

    const count = clients.length;
    if (count === 0) return;

    const isDark = theme === 'og';

    clients.forEach((client, idx) => {
      let radius = 17;
      if (client.clientTierName === 'Very High') radius = 10;
      else if (client.clientTierName === 'High') radius = 17;
      else if (client.clientTierName === 'Medium') radius = 24;
      else radius = 30;

      const angle = (idx / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(idx * 2) * 1.5;

      const isSelected = selectedClient?.clientId === client.clientId;

      // Clean opaque sphere
      const nodeGeo = new THREE.SphereGeometry(isSelected ? 0.8 : 0.5, 24, 24);
      let nodeColor = isDark ? 0x38bdf8 : 0x0284c7;
      if (client.clientStatusName === 'Active') nodeColor = isDark ? 0x34d399 : 0x16a34a;
      else if (client.clientStatusName === 'At Risk') nodeColor = isDark ? 0xfbbf24 : 0xd97706;
      else if (client.clientStatusName === 'Churned') nodeColor = isDark ? 0xf87171 : 0xdc2626;

      const nodeMat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        roughness: 0.3,
        metalness: 0.5,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);

      // Subtle ring halo
      const haloGeo = new THREE.RingGeometry(0.7, 0.85, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x00f0ff : 0x0284c7,
        transparent: true,
        opacity: isSelected ? 0.8 : 0.2,
        side: THREE.DoubleSide
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(x, y, z);
      haloMesh.rotation.x = Math.PI / 2;

      nodesGroup.add(nodeMesh);
      nodesGroup.add(haloMesh);

      clientNodesMap.current.set(client.clientId, {
        mesh: nodeMesh,
        halo: haloMesh,
        client,
      });
    });
  }, [clients, selectedClient, theme]);

  // Smooth camera centering
  useEffect(() => {
    if (selectedClient && clientNodesMap.current.has(selectedClient.clientId)) {
      const entry = clientNodesMap.current.get(selectedClient.clientId)!;
      const pos = entry.mesh.position;
      targetCameraPos.current.set(pos.x * 1.3, pos.y + 4, pos.z * 1.3 + 10);
      targetLookAt.current.set(pos.x, pos.y, pos.z);
    } else {
      targetCameraPos.current.set(0, 16, 42);
      targetLookAt.current.set(0, 0, 0);
    }
  }, [selectedClient]);

  const handleResetCamera = () => {
    setSelectedClient(null);
    targetCameraPos.current.set(0, 16, 42);
    targetLookAt.current.set(0, 0, 0);
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full flex-1" />

      {/* Floating HUD Controls and Selected Node Inspector */}
      <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-20 space-y-2 pointer-events-none">
        
        {/* Inspection Card */}
        {(selectedClient || hoveredClient) ? (
          <div
            className="p-4 rounded-xl border shadow-xl pointer-events-auto space-y-2.5 transition-all"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {(() => {
              const c = selectedClient || hoveredClient!;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-tech uppercase tracking-wider text-[var(--accent-cyan)] font-bold">
                      {selectedClient ? 'SELECTED NODE' : 'HOVER PREVIEW'}
                    </span>
                    <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-semibold border ${
                      c.clientStatusName === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      c.clientStatusName === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {c.clientStatusName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border bg-black/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      {c.companyLogo ? (
                        <img src={c.logoUrl} alt={c.clientName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs font-bold font-mono text-[var(--text-muted)]">{c.clientCode}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold font-display text-[var(--text-primary)] truncate">
                        {c.clientName}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-mono-tech">
                        {c.clientCode} · {c.domainName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tech text-[var(--text-secondary)] pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div>Location: <strong className="text-[var(--text-primary)]">{c.locationName}</strong></div>
                    <div>Tenure: <strong className="text-[var(--text-primary)]">{c.derivedTenureYears} yrs</strong></div>
                    <div>Services: <strong className="text-cyan-400">{c.distinctServicesCount} availed</strong></div>
                    <div>Tier: <strong className="text-[var(--text-primary)]">{c.clientTierName || 'Standard'}</strong></div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedClient(c);
                        setActiveTab('detail');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-mono-tech font-bold bg-[var(--accent-cyan)] text-black flex items-center justify-center gap-1.5 hover:opacity-90"
                    >
                      <span>Open Full Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    {selectedClient && (
                      <button
                        onClick={handleResetCamera}
                        className="py-1.5 px-3 rounded-lg text-xs font-mono-tech border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div
            className="p-3.5 rounded-xl border pointer-events-auto space-y-1.5"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between text-xs font-mono-tech text-[var(--text-muted)]">
              <span className="font-bold text-[var(--text-primary)]">Spatial Client Constellation</span>
              <span className="text-[10px]">49 Enterprise Clients</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono-tech leading-relaxed">
              Concentric orbital rings group clients by tier: Inner (Tier 1 Very High) to Outer (Tier 4 Emerging). Click any node to inspect and open client profile.
            </p>
          </div>
        )}
      </div>

      {/* Floating Control Toolbar (Top Right of 3D Canvas) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-xl border text-xs font-mono-tech flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-all"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)'
          }}
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset Orbit</span>
        </button>
      </div>
    </div>
  );
};
