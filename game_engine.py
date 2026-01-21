"""
DROP THE BOSS - Backend Game Engine (OPTIMIZED)
===============================================

OPTIMIZATIONS:
- Ambient clouds: minimal physics interaction (visual layer only)
- Cloud consistency: all clouds look identical
- Collectible scatter: wider distribution, more valuable
- Collision precision: tightened for accuracy
"""

import math
import hashlib
import time
import struct
import random
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class TensionLevel(Enum):
    """Tension zones for path segments"""
    CALM = 0
    BUILDING = 1
    PEAK = 2
    RELEASE = 3


class CloudRole(Enum):
    """Cloud actor roles"""
    GUIDE = "guide"
    REDIRECT = "redirect"
    BRAKE = "brake"
    STOPPER = "stopper"
    AMBIENT = "ambient"  # NEW: Minimal interaction


# World constants
SCREEN_W = 1920
SCREEN_H = 1200
SCREEN_CENTER = SCREEN_W // 2

WORLD_HEIGHT = 20000
GROUND_Y = 19300
GROUND_COLLISION_Y = 19280

# Dead zones
PLANE_DEAD_ZONE = 200
GROUND_DEAD_ZONE = 200
SPAWN_START_Y = SCREEN_H // 2 + PLANE_DEAD_ZONE
SPAWN_END_Y = GROUND_Y - GROUND_DEAD_ZONE

# Soft envelope
CORE_WIDTH = 600
SOFT_ZONE_WIDTH = 300
ENVELOPE_INNER = SCREEN_CENTER - CORE_WIDTH
ENVELOPE_OUTER = SCREEN_CENTER + CORE_WIDTH
CORRECTION_INNER = ENVELOPE_INNER - SOFT_ZONE_WIDTH
CORRECTION_OUTER = ENVELOPE_OUTER + SOFT_ZONE_WIDTH

# Physics (MUST MATCH FRONTEND)
GRAVITY = 0.55
MAX_FALL = 28
AIR_FRICTION = 0.995
GROUND_FRICTION = 0.85
PLAYER_RADIUS = 65

# Cloud defaults
DEFAULT_CLOUD_RADIUS = 110
DEFAULT_BOUNCE = 0.65
DEFAULT_FRICTION = 0.85

# AMBIENT cloud physics (WEAK interaction)
AMBIENT_BOUNCE = 0.15      # Very weak bounce
AMBIENT_FRICTION = 0.98    # Almost no friction loss
AMBIENT_RADIUS_SCALE = 0.85  # Slightly smaller collision

# Object sizes
TANK_W, TANK_H = 400, 300
CAMP_W, CAMP_H = 800, 600
BH_SIZE, BH_RADIUS = 300, 100
DARK_W, DARK_H = 420, 280

# Outcome probabilities
OUTCOMES = [
    (0.40, 0.0, 0.0, 'dead'),
    (0.28, 0.3, 0.8, 'low'),
    (0.16, 0.9, 1.5, 'medium'),
    (0.10, 1.8, 3.5, 'high'),
    (0.04, 4.0, 8.0, 'jackpot'),
    (0.02, 10.0, 25.0, 'mega'),
]


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class TrajectoryPoint:
    """Player state at a moment in time"""
    x: float
    y: float
    vx: float
    vy: float
    step: int = 0

    @property
    def speed(self) -> float:
        return math.sqrt(self.vx ** 2 + self.vy ** 2)

    def copy(self) -> 'TrajectoryPoint':
        return TrajectoryPoint(self.x, self.y, self.vx, self.vy, self.step)


@dataclass
class PathSegment:
    """Metadata for pipeline segment"""
    y_start: float
    y_end: float
    ideal_x_start: float
    ideal_x_end: float
    tolerance: float
    tension: TensionLevel
    curvature: float


@dataclass
class NarrativeFlags:
    """What's allowed in this run"""
    allow_dark_clouds: bool = True
    allow_black_hole: bool = False
    allow_collectibles: bool = True
    max_dark_clouds: int = 2
    tension_profile: List[TensionLevel] = None


# ============================================================================
# GAME ENGINE
# ============================================================================

class GameEngine:
    """The Master Puppeteer"""
    
    def __init__(self):
        self.rng_state = None
    
    # ========================================================================
    # RNG (DETERMINISTIC)
    # ========================================================================
    
    def generate_seed(self) -> int:
        """Generate cryptographic seed"""
        timestamp = struct.pack('d', time.time())
        random_bytes = random.getrandbits(128).to_bytes(16, 'big')
        combined = timestamp + random_bytes
        return int(hashlib.sha256(combined).hexdigest()[:8], 16)
    
    def mulberry32(self, seed: int):
        """Mulberry32 PRNG (matches frontend)"""
        state = {'t': seed & 0xFFFFFFFF}
        
        def next_random() -> float:
            state['t'] = (state['t'] + 0x6D2B79F5) & 0xFFFFFFFF
            x = state['t']
            x = ((x ^ (x >> 15)) * (x | 1)) & 0xFFFFFFFF
            x = (x ^ (x + ((x ^ (x >> 7)) * (x | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
            return ((x ^ (x >> 14)) & 0xFFFFFFFF) / 4294967296
        
        return next_random
    
    # ========================================================================
    # OUTCOME DECISION
    # ========================================================================
    
    def roll_outcome(self, rng) -> Dict:
        """Roll for outcome type and multiplier"""
        r = rng()
        cumulative = 0
        
        for prob, min_mult, max_mult, outcome_type in OUTCOMES:
            cumulative += prob
            if r < cumulative:
                if min_mult == max_mult:
                    multiplier = min_mult
                else:
                    multiplier = min_mult + rng() * (max_mult - min_mult)
                
                return {
                    'type': outcome_type,
                    'multiplier': round(multiplier, 2)
                }
        
        return {'type': 'dead', 'multiplier': 0}
    
    def determine_narrative_flags(self, outcome: Dict, rng) -> NarrativeFlags:
        """Decide what actors are allowed"""
        otype = outcome['type']
        
        if otype == 'dead':
            return NarrativeFlags(
                allow_dark_clouds=False,
                allow_black_hole=False,
                allow_collectibles=False,
                max_dark_clouds=0
            )
        
        elif otype == 'low':
            return NarrativeFlags(
                allow_dark_clouds=rng() < 0.4,
                allow_black_hole=False,
                allow_collectibles=True,
                max_dark_clouds=1
            )
        
        elif otype == 'medium':
            return NarrativeFlags(
                allow_dark_clouds=rng() < 0.5,
                allow_black_hole=False,
                allow_collectibles=True,
                max_dark_clouds=1
            )
        
        elif otype == 'high':
            return NarrativeFlags(
                allow_dark_clouds=rng() < 0.6,
                allow_black_hole=False,
                allow_collectibles=True,
                max_dark_clouds=2
            )
        
        elif otype in ['jackpot', 'mega']:
            return NarrativeFlags(
                allow_dark_clouds=rng() < 0.3,
                allow_black_hole=True,
                allow_collectibles=True,
                max_dark_clouds=1
            )
        
        return NarrativeFlags()
    
    # ========================================================================
    # PIPELINE PATH (THE SPINE)
    # ========================================================================
    
    def generate_pipeline(self, target_x: float, target_y: float, 
                         outcome: Dict, rng) -> List[PathSegment]:
        """Generate the ideal path (the spine)"""
        segments = []
        
        start_x = SCREEN_CENTER
        start_y = SPAWN_START_Y
        
        num_segments = max(5, int((target_y - start_y) / 2500))
        
        # Control point for curve
        control_x = start_x + (rng() - 0.5) * 400
        
        for i in range(num_segments):
            progress_start = i / num_segments
            progress_end = (i + 1) / num_segments
            
            t_start = self._ease(progress_start)
            t_end = self._ease(progress_end)
            
            y_start = start_y + (target_y - start_y) * progress_start
            y_end = start_y + (target_y - start_y) * progress_end
            
            # Bezier-like curve
            if progress_start < 0.5:
                blend_start = progress_start * 2
                x_start = start_x + (control_x - start_x) * self._ease(blend_start)
            else:
                blend_start = (progress_start - 0.5) * 2
                x_start = control_x + (target_x - control_x) * self._ease(blend_start)
            
            if progress_end < 0.5:
                blend_end = progress_end * 2
                x_end = start_x + (control_x - start_x) * self._ease(blend_end)
            else:
                blend_end = (progress_end - 0.5) * 2
                x_end = control_x + (target_x - control_x) * self._ease(blend_end)
            
            # Tolerance tightens near target
            tolerance = 250 - progress_end * 100
            
            # Tension profile
            if progress_start < 0.2:
                tension = TensionLevel.CALM
            elif progress_start < 0.6:
                tension = TensionLevel.BUILDING
            elif progress_start < 0.85:
                tension = TensionLevel.PEAK
            else:
                tension = TensionLevel.RELEASE
            
            curvature = (x_end - x_start) / 500
            
            segments.append(PathSegment(
                y_start=y_start,
                y_end=y_end,
                ideal_x_start=x_start,
                ideal_x_end=x_end,
                tolerance=tolerance,
                tension=tension,
                curvature=curvature
            ))
        
        return segments
    
    def get_ideal_x_at_y(self, segments: List[PathSegment], y: float) -> float:
        """Get ideal X position at given Y"""
        for seg in segments:
            if seg.y_start <= y <= seg.y_end:
                if abs(seg.y_end - seg.y_start) < 0.001:
                    return seg.ideal_x_start
                
                t = (y - seg.y_start) / (seg.y_end - seg.y_start)
                return seg.ideal_x_start + (seg.ideal_x_end - seg.ideal_x_start) * t
        
        if y < segments[0].y_start:
            return segments[0].ideal_x_start
        return segments[-1].ideal_x_end
    
    def get_tolerance_at_y(self, segments: List[PathSegment], y: float) -> float:
        """Get tolerance at given Y"""
        for seg in segments:
            if seg.y_start <= y <= seg.y_end:
                return seg.tolerance
        return 200
    
    # ========================================================================
    # PHYSICS SIMULATION
    # ========================================================================
    
    def simulate_step(self, point: TrajectoryPoint, 
                     clouds: List[Dict]) -> TrajectoryPoint:
        """
        Simulate ONE physics step.
        MUST match frontend exactly.
        """
        x, y = point.x, point.y
        vx, vy = point.vx, point.vy
        
        # Gravity
        vy = min(vy + GRAVITY, MAX_FALL)
        
        # Cloud collisions
        for cloud in clouds:
            cx = cloud['x']
            cy = cloud['centerY']
            base_radius = cloud.get('radius', DEFAULT_CLOUD_RADIUS)
            
            # AMBIENT clouds have smaller collision radius
            if cloud.get('role') == 'ambient':
                cr = base_radius * AMBIENT_RADIUS_SCALE
            else:
                cr = base_radius
            
            dx = x - cx
            dy = y - cy
            dist_sq = dx * dx + dy * dy
            min_dist = PLAYER_RADIUS + cr
            
            if dist_sq < min_dist * min_dist and dist_sq > 0.001:
                dist = math.sqrt(dist_sq)
                nx = dx / dist
                ny = dy / dist
                
                # Push out (tightened for precision)
                overlap = min_dist - dist
                push_factor = 0.65 if cloud.get('role') != 'ambient' else 0.3
                x += nx * overlap * push_factor
                y += ny * overlap * push_factor
                
                # Velocity response
                rel_vel = vx * nx + vy * ny
                
                if rel_vel < 0:
                    role = cloud.get('role', 'normal')
                    influence = cloud.get('influence', {})
                    
                    if role == 'stopper':
                        bounce = influence.get('bounce', 0.05)
                        friction = influence.get('friction', 0.95)
                        vx *= (1 - friction * 0.6)
                        vy *= -bounce if vy > 0 else 0.2
                    
                    elif role == 'ambient':
                        # AMBIENT: Very weak interaction
                        bounce = AMBIENT_BOUNCE
                        friction = AMBIENT_FRICTION
                        
                        # Minimal bounce
                        vx -= (1 + bounce) * rel_vel * nx * 0.3
                        vy -= (1 + bounce) * rel_vel * ny * 0.3
                        
                        # Almost no friction
                        vx *= friction
                        vy *= friction
                    
                    else:
                        # Normal control clouds
                        bounce = influence.get('bounce', DEFAULT_BOUNCE)
                        vx -= (1 + bounce) * rel_vel * nx
                        vy -= (1 + bounce) * rel_vel * ny
                        
                        friction = influence.get('friction', DEFAULT_FRICTION)
                        tang_x = vx - (vx * nx + vy * ny) * nx
                        tang_y = vy - (vx * nx + vy * ny) * ny
                        vx -= tang_x * (1 - friction)
                        vy -= tang_y * (1 - friction)
                        
                        # Apply deltas
                        vx += influence.get('vx_delta', 0)
                        vy += influence.get('vy_delta', 0)
                        
                        # Damping
                        vx *= 0.92
                        vy *= 0.92
        
        # Update position
        x += vx
        y += vy
        
        # Air friction
        vx *= AIR_FRICTION
        
        # Soft envelope
        if x < CORRECTION_INNER:
            correction = (CORRECTION_INNER - x) * 0.008
            vx += correction
        elif x > CORRECTION_OUTER:
            correction = (x - CORRECTION_OUTER) * 0.008
            vx -= correction
        
        # Hard bounds
        if x < 50:
            x = 50
            vx = abs(vx) * 0.3
        elif x > SCREEN_W - 50:
            x = SCREEN_W - 50
            vx = -abs(vx) * 0.3
        
        # Ground
        if y >= GROUND_COLLISION_Y - PLAYER_RADIUS:
            y = GROUND_COLLISION_Y - PLAYER_RADIUS
            if vy > 2:
                vy = -vy * 0.2
                vx *= 0.7
            else:
                vy = 0
                vx *= GROUND_FRICTION
        
        return TrajectoryPoint(x, y, vx, vy, point.step + 1)
    
    def simulate_trajectory(self, clouds: List[Dict],
                           start: TrajectoryPoint = None,
                           stop_y: float = None,
                           max_steps: int = 25000) -> List[TrajectoryPoint]:
        """Simulate full trajectory"""
        if start is None:
            start = TrajectoryPoint(SCREEN_CENTER, SPAWN_START_Y, 0, 5)
        if stop_y is None:
            stop_y = GROUND_COLLISION_Y
        
        point = start.copy()
        trajectory = [point.copy()]
        sample_interval = 15
        
        for step in range(max_steps):
            point = self.simulate_step(point, clouds)
            
            if step % sample_interval == 0:
                trajectory.append(point.copy())
            
            if point.y >= stop_y - 20:
                trajectory.append(point.copy())
                break
            
            if point.y > SPAWN_START_Y and point.speed < 0.8:
                trajectory.append(point.copy())
                break
        
        return trajectory
    
    def find_point_at_y(self, trajectory: List[TrajectoryPoint],
                       target_y: float) -> Optional[TrajectoryPoint]:
        """Find point at Y via interpolation"""
        for i, point in enumerate(trajectory):
            if point.y >= target_y:
                if i == 0:
                    return point.copy()
                
                prev = trajectory[i - 1]
                if abs(point.y - prev.y) < 0.001:
                    return point.copy()
                
                t = (target_y - prev.y) / (point.y - prev.y)
                return TrajectoryPoint(
                    prev.x + (point.x - prev.x) * t,
                    target_y,
                    prev.vx + (point.vx - prev.vx) * t,
                    prev.vy + (point.vy - prev.vy) * t,
                    prev.step
                )
        
        return trajectory[-1].copy() if trajectory else None
    
    # ========================================================================
    # CLOUD CREATION
    # ========================================================================
    
    def create_cloud(self, x: float, y: float, role: str,
                    radius: float = None, influence: Dict = None) -> Dict:
        """Create a cloud actor"""
        radius = radius or DEFAULT_CLOUD_RADIUS
        
        if influence is None:
            if role == 'stopper':
                influence = {'friction': 0.95, 'bounce': 0.05}
            elif role == 'brake':
                influence = {'friction': 0.9, 'bounce': 0.2, 'vy_delta': -2}
            elif role == 'redirect':
                influence = {'friction': 0.85, 'bounce': 0.7}
            elif role == 'guide':
                influence = {'friction': 0.85, 'bounce': 0.6}
            elif role == 'ambient':
                # AMBIENT: Minimal physics
                influence = {'friction': AMBIENT_FRICTION, 'bounce': AMBIENT_BOUNCE}
            else:
                influence = {'friction': 0.9, 'bounce': 0.4}
        
        visual_height = radius * 1.4
        visual_y = y - visual_height * 0.35
        
        return {
            'type': 'cloud',
            'x': int(x),
            'y': int(visual_y),
            'centerY': int(y),
            'radius': int(radius),
            'role': role,
            'influence': influence
        }
    
    def build_stopper_trap(self, x: float, y: float, rng) -> List[Dict]:
        """Build trap to catch player"""
        clouds = []
        
        if y < SPAWN_START_Y or y > SPAWN_END_Y:
            return clouds
        
        # Bowl shape
        positions = [
            (0, 0, 130),
            (-150, 25, 110),
            (150, 25, 110),
            (-75, 90, 100),
            (75, 90, 100),
            (0, 130, 120),
        ]
        
        for dx, dy, radius in positions:
            cx = x + dx + (rng() - 0.5) * 25
            cy = y + dy
            
            cx = max(CORRECTION_INNER + radius,
                    min(CORRECTION_OUTER - radius, cx))
            
            if cy > SPAWN_END_Y:
                continue
            
            clouds.append(self.create_cloud(cx, cy, 'stopper', radius=radius))
        
        return clouds
    
    # ========================================================================
    # CORRECTION CLOUDS (INVISIBLE CONTROL)
    # ========================================================================
    
    def place_correction_clouds(self, segments: List[PathSegment],
                                rng, max_attempts: int = 10) -> List[Dict]:
        """Place correction clouds to guide player along pipeline"""
        clouds = []
        
        for attempt in range(max_attempts):
            trajectory = self.simulate_trajectory(clouds)
            
            corrections_needed = 0
            
            for seg in segments:
                num_checks = 3
                for i in range(num_checks):
                    progress = (i + 1) / (num_checks + 1)
                    check_y = seg.y_start + (seg.y_end - seg.y_start) * progress
                    
                    point = self.find_point_at_y(trajectory, check_y)
                    if point is None:
                        continue
                    
                    ideal_x = self.get_ideal_x_at_y(segments, check_y)
                    tolerance = self.get_tolerance_at_y(segments, check_y)
                    
                    deviation = point.x - ideal_x
                    
                    if abs(deviation) > tolerance:
                        cloud = self._place_correction_cloud(
                            point, ideal_x, deviation, rng
                        )
                        if cloud:
                            clouds.append(cloud)
                            corrections_needed += 1
            
            if corrections_needed == 0:
                break
        
        return clouds
    
    def _place_correction_cloud(self, point: TrajectoryPoint,
                                ideal_x: float, deviation: float,
                                rng) -> Optional[Dict]:
        """Place single correction cloud"""
        # Cloud goes on OPPOSITE side
        if deviation > 0:
            cloud_x = point.x + 70 + rng() * 50
        else:
            cloud_x = point.x - 70 - rng() * 50
        
        cloud_y = point.y + 120 + rng() * 150
        
        cloud_x = max(CORRECTION_INNER + 50,
                     min(CORRECTION_OUTER - 50, cloud_x))
        
        if cloud_y < SPAWN_START_Y or cloud_y > SPAWN_END_Y:
            return None
        
        strength = min(abs(deviation) / 200, 1)
        bounce = 0.5 + strength * 0.25
        vx_nudge = -math.copysign(min(4, strength * 5), deviation)
        
        role = 'redirect' if strength > 0.7 else 'guide'
        
        return self.create_cloud(
            cloud_x, cloud_y, role,
            radius=int(95 + rng() * 35),
            influence={'bounce': bounce, 'friction': 0.85, 'vx_delta': vx_nudge}
        )
    
    # ========================================================================
    # AMBIENT CLOUDS (VISUAL LAYER)
    # ========================================================================
    
    def place_ambient_clouds(self, segments: List[PathSegment],
                            control_clouds: List[Dict], rng) -> List[Dict]:
        """
        Place ambient clouds for visual richness.
        
        These should NOT interfere with gameplay:
        - Weak physics (minimal bounce/friction)
        - Placed away from control path
        - SAME SIZE as control clouds for consistency
        """
        ambient = []
        
        # Get control cloud positions for avoidance
        control_positions = [(c['x'], c['centerY']) for c in control_clouds]
        
        # INCREASED: 70-100 ambient clouds
        num_ambient = 70 + int(rng() * 30)
        
        for _ in range(num_ambient):
            y = SPAWN_START_Y + 500 + rng() * (SPAWN_END_Y - SPAWN_START_Y - 1000)
            
            # Distribute across zones
            zone = rng()
            if zone < 0.35:
                # Left edge
                x = CORRECTION_INNER - 100 + rng() * 250
            elif zone < 0.70:
                # Right edge
                x = CORRECTION_OUTER - 150 + rng() * 250
            else:
                # Middle (sparse)
                x = ENVELOPE_INNER + rng() * (ENVELOPE_OUTER - ENVELOPE_INNER)
            
            # Check not overlapping control clouds
            too_close = any(
                abs(cx - x) < 220 and abs(cy - y) < 200
                for cx, cy in control_positions
            )
            
            if too_close:
                continue
            
            # SAME radius as control clouds (consistency)
            radius = int(95 + rng() * 40)
            
            ambient.append(self.create_cloud(
                x, y, 'ambient',
                radius=radius
            ))
        
        # Add floating layers
        ambient.extend(self._add_cloud_layers(control_positions, rng))
        
        return ambient
    
    def _add_cloud_layers(self, control_positions: List[Tuple[float, float]], 
                         rng) -> List[Dict]:
        """Add horizontal cloud layers at key heights"""
        layers = []
        
        layer_heights = [
            SPAWN_START_Y + 1500,
            SPAWN_START_Y + 4000,
            SPAWN_START_Y + 7000,
            SPAWN_START_Y + 10000,
            SPAWN_START_Y + 13000,
        ]
        
        for layer_y in layer_heights:
            if layer_y > SPAWN_END_Y:
                continue
            
            # 10-14 clouds per layer
            num_in_layer = 10 + int(rng() * 4)
            for i in range(num_in_layer):
                x = CORRECTION_INNER + (i / num_in_layer) * (CORRECTION_OUTER - CORRECTION_INNER)
                x += (rng() - 0.5) * 180
                y = layer_y + (rng() - 0.5) * 400
                
                # Check not overlapping control
                too_close = any(
                    abs(cx - x) < 220 and abs(cy - y) < 200
                    for cx, cy in control_positions
                )
                
                if not too_close:
                    radius = int(90 + rng() * 45)
                    layers.append(self.create_cloud(
                        x, y, 'ambient',
                        radius=radius
                    ))
        
        return layers
    
    # ========================================================================
    # DARK CLOUDS (DRAMA LAYER)
    # ========================================================================
    
    def place_dark_clouds(self, segments: List[PathSegment],
                         clouds: List[Dict], flags: NarrativeFlags,
                         rng) -> List[Dict]:
        """Place dark clouds for drama"""
        if not flags.allow_dark_clouds or flags.max_dark_clouds == 0:
            return []
        
        dark_clouds = []
        
        trajectory = self.simulate_trajectory(clouds)
        
        tension_segments = [
            seg for seg in segments 
            if seg.tension in [TensionLevel.BUILDING, TensionLevel.PEAK]
        ]
        
        if not tension_segments:
            return []
        
        num_dark = min(flags.max_dark_clouds, len(tension_segments))
        
        for i in range(num_dark):
            seg = tension_segments[int(rng() * len(tension_segments))]
            
            check_y = seg.y_start + (seg.y_end - seg.y_start) * (0.4 + rng() * 0.3)
            point = self.find_point_at_y(trajectory, check_y)
            
            if point is None:
                continue
            
            ideal_x = self.get_ideal_x_at_y(segments, check_y)
            tolerance = self.get_tolerance_at_y(segments, check_y)
            
            offset = tolerance * (0.8 + rng() * 0.4)
            offset *= 1 if rng() < 0.5 else -1
            
            dark_x = ideal_x + offset
            dark_y = check_y + 200 + rng() * 400
            
            dark_x = max(CORRECTION_INNER + DARK_W // 2,
                        min(CORRECTION_OUTER - DARK_W // 2, dark_x))
            
            if dark_y > SPAWN_END_Y - 500:
                continue
            
            dark_clouds.append({
                'type': 'darkcloud',
                'x': int(dark_x),
                'y': int(dark_y)
            })
        
        return dark_clouds
    
    # ========================================================================
    # BLACK HOLES (SHOWCASE LAYER)
    # ========================================================================
    
    def place_black_hole(self, segments: List[PathSegment],
                        clouds: List[Dict], target_payout: float,
                        multiplier: float, rng) -> Optional[Dict]:
        """Place black hole on the pipeline"""
        trajectory = self.simulate_trajectory(clouds)
        
        best_point = None
        best_deviation = float('inf')
        
        mid_start_y = SPAWN_START_Y + (SPAWN_END_Y - SPAWN_START_Y) * 0.3
        mid_end_y = SPAWN_START_Y + (SPAWN_END_Y - SPAWN_START_Y) * 0.7
        
        for point in trajectory:
            if mid_start_y <= point.y <= mid_end_y:
                ideal_x = self.get_ideal_x_at_y(segments, point.y)
                deviation = abs(point.x - ideal_x)
                
                if deviation < best_deviation:
                    best_deviation = deviation
                    best_point = point
        
        if best_point is None:
            return None
        
        return {
            'type': 'blackhole',
            'x': int(best_point.x),
            'y': int(best_point.y),
            'multiplier': multiplier,
            'payout': target_payout
        }
    
    # ========================================================================
    # COLLECTIBLES (DOPAMINE LAYER) - OPTIMIZED
    # ========================================================================
    
    def place_collectibles(self, segments: List[PathSegment],
                          clouds: List[Dict], flags: NarrativeFlags,
                          rng) -> List[Dict]:
        """
        Place collectibles with WIDE scatter for visual value.
        
        OPTIMIZATIONS:
        - More count (80-120)
        - Wider scatter (±600px)
        - Some intentionally off-path
        - Better vertical distribution
        """
        if not flags.allow_collectibles:
            return []
        
        collectibles = []
        
        trajectory = self.simulate_trajectory(clouds)
        
        # INCREASED: 80-120 collectibles (was 30-55)
        num_collectibles = 80 + int(rng() * 40)
        
        # Strategy: Mix on-path and off-path
        num_on_path = int(num_collectibles * 0.6)  # 60% near path
        num_scattered = num_collectibles - num_on_path  # 40% scattered
        
        # === ON-PATH COLLECTIBLES ===
        for _ in range(num_on_path):
            if len(trajectory) < 3:
                break
            
            idx = 1 + int(rng() * (len(trajectory) - 2))
            point = trajectory[idx]
            
            # WIDER scatter (±600px, was ±350)
            cx = point.x + (rng() - 0.5) * 600
            cy = point.y + (rng() - 0.5) * 400
            
            cx = max(CORRECTION_INNER - 100,
                    min(CORRECTION_OUTER + 100, cx))
            cy = max(SPAWN_START_Y + 200,
                    min(SPAWN_END_Y - 300, cy))
            
            collectibles.append({
                'type': 'nuke' if rng() < 0.6 else 'note',
                'x': int(cx),
                'y': int(cy)
            })
        
        # === SCATTERED COLLECTIBLES (off-path) ===
        for _ in range(num_scattered):
            # Random Y distribution
            y = SPAWN_START_Y + 800 + rng() * (SPAWN_END_Y - SPAWN_START_Y - 1500)
            
            # Random X (wider range)
            zone = rng()
            if zone < 0.3:
                # Far left
                x = CORRECTION_INNER - 150 + rng() * 200
            elif zone < 0.6:
                # Far right
                x = CORRECTION_OUTER - 50 + rng() * 200
            else:
                # Random middle
                x = ENVELOPE_INNER + rng() * (ENVELOPE_OUTER - ENVELOPE_INNER)
            
            x = max(100, min(SCREEN_W - 100, x))
            
            collectibles.append({
                'type': 'nuke' if rng() < 0.6 else 'note',
                'x': int(x),
                'y': int(y)
            })
        
        return collectibles
    
    # ========================================================================
    # PUSHABLES (NARRATIVE LAYER)
    # ========================================================================
    
    def place_ground_objects(self, target_x: float, outcome: Dict,
                            target_payout: float, rng) -> List[Dict]:
        """Place tank/camp on ground"""
        objects = []
        
        otype = outcome['type']
        
        if otype == 'medium':
            # Tank landing
            tank_x = target_x
            objects.append({
                'type': 'tank',
                'x': int(tank_x),
                'y': GROUND_Y,
                'payout': target_payout,
                'multiplier': 5
            })
            
            # Decoy camp
            camp_x = self._opposite_x(tank_x, rng)
            objects.append({
                'type': 'camp',
                'x': int(camp_x),
                'y': GROUND_Y,
                'payout': 0,
                'multiplier': 50
            })
        
        elif otype == 'high':
            # Camp landing
            camp_x = target_x
            objects.append({
                'type': 'camp',
                'x': int(camp_x),
                'y': GROUND_Y,
                'payout': target_payout,
                'multiplier': 50
            })
            
            # Decoy tank
            tank_x = self._opposite_x(camp_x, rng)
            objects.append({
                'type': 'tank',
                'x': int(tank_x),
                'y': GROUND_Y,
                'payout': 0,
                'multiplier': 5
            })
        
        else:
            # Random placement
            if rng() < 0.7:
                tank_x = ENVELOPE_INNER + rng() * (ENVELOPE_OUTER - ENVELOPE_INNER)
                objects.append({
                    'type': 'tank',
                    'x': int(tank_x),
                    'y': GROUND_Y,
                    'payout': 0,
                    'multiplier': 5
                })
            
            if rng() < 0.7:
                camp_x = ENVELOPE_INNER + rng() * (ENVELOPE_OUTER - ENVELOPE_INNER)
                if not objects or abs(camp_x - objects[0]['x']) > 500:
                    objects.append({
                        'type': 'camp',
                        'x': int(camp_x),
                        'y': GROUND_Y,
                        'payout': 0,
                        'multiplier': 50
                    })
        
        return objects
    
    # ========================================================================
    # SCORE PROGRESSION
    # ========================================================================
    
    def generate_score_progression(self, stop_y: float,
                                   target_payout: float) -> List[Dict]:
        """Generate authoritative score milestones"""
        milestones = []
        
        start_y = SPAWN_START_Y
        num_steps = 30
        
        for i in range(num_steps + 1):
            progress = i / num_steps
            y = start_y + (stop_y - start_y) * progress
            eased = self._ease(progress)
            score = round(target_payout * eased, 2)
            milestones.append({'y': int(y), 'score': score})
        
        return milestones
    
    # ========================================================================
    # RUN VALIDATION (QUALITY FILTER)
    # ========================================================================
    
    def validate_run(self, clouds: List[Dict], trajectory: List[TrajectoryPoint],
                    segments: List[PathSegment]) -> Tuple[bool, str]:
        """Validate run quality"""
        # Too many correction clouds?
        correction_clouds = [c for c in clouds if c.get('role') in ['guide', 'redirect']]
        if len(correction_clouds) > 25:
            return False, "too_many_corrections"
        
        # Check oscillation
        if len(trajectory) > 10:
            direction_changes = 0
            for i in range(1, len(trajectory) - 1):
                prev_vx = trajectory[i - 1].vx
                curr_vx = trajectory[i].vx
                if abs(prev_vx) > 0.5 and abs(curr_vx) > 0.5:
                    if (prev_vx > 0) != (curr_vx > 0):
                        direction_changes += 1
            
            if direction_changes > len(trajectory) * 0.3:
                return False, "oscillating"
        
        # Check stalls
        stall_count = 0
        for point in trajectory:
            if point.y > SPAWN_START_Y + 1000 and point.speed < 1.5:
                stall_count += 1
        
        if stall_count > len(trajectory) * 0.15:
            return False, "stalling"
        
        # Check sharp turns
        if len(trajectory) > 5:
            sharp_turns = 0
            for i in range(2, len(trajectory)):
                prev = trajectory[i - 2]
                curr = trajectory[i]
                dx = curr.x - prev.x
                if abs(dx) > 400:
                    sharp_turns += 1
            
            if sharp_turns > 3:
                return False, "sharp_turns"
        
        return True, "valid"
    
    # ========================================================================
    # MAIN GENERATION
    # ========================================================================
    
    def generate_game(self, bet_amount: float,
                     bonus_mode: bool = False,
                     max_retries: int = 5) -> Dict:
        """Generate complete game"""
        for attempt in range(max_retries):
            try:
                result = self._generate_game_attempt(bet_amount, bonus_mode)
                
                # Validate
                all_clouds = [s for s in result['script']['spawns'] if s['type'] == 'cloud']
                trajectory = result.get('_trajectory', [])
                segments = result.get('_segments', [])
                
                if trajectory and segments:
                    valid, reason = self.validate_run(all_clouds, trajectory, segments)
                    if not valid:
                        print(f"  Attempt {attempt + 1}: Rejected ({reason})")
                        continue
                
                # Clean internal data
                result.pop('_trajectory', None)
                result.pop('_segments', None)
                
                return result
            
            except Exception as e:
                print(f"  Attempt {attempt + 1}: Error ({e})")
                continue
        
        # Fallback
        print("  All attempts failed - returning death")
        return self._generate_death_fallback(bet_amount, bonus_mode)
    
    def _generate_game_attempt(self, bet_amount: float,
                               bonus_mode: bool) -> Dict:
        """Single generation attempt"""
        # RNG
        seed = self.generate_seed()
        rng = self.mulberry32(seed)
        
        # Outcome
        outcome = self.roll_outcome(rng)
        effective_bet = bet_amount * (10 if bonus_mode else 1)
        target_payout = round(effective_bet * outcome['multiplier'], 2)
        
        # Narrative flags
        flags = self.determine_narrative_flags(outcome, rng)
        
        # Target
        target_x, target_y, stop_method = self._determine_target(outcome, rng)
        
        # Pipeline
        segments = self.generate_pipeline(target_x, target_y, outcome, rng)
        
        # CONTROL clouds (these actually guide)
        control_clouds = self.place_correction_clouds(segments, rng)
        
        # Add stopper trap if needed
        if stop_method == 'trap':
            trap = self.build_stopper_trap(target_x, target_y, rng)
            control_clouds.extend(trap)
        
        # AMBIENT clouds (visual only, minimal physics)
        ambient_clouds = self.place_ambient_clouds(segments, control_clouds, rng)
        
        # Simulate with ALL clouds
        all_clouds = control_clouds + ambient_clouds
        trajectory = self.simulate_trajectory(all_clouds, stop_y=target_y + 300)
        
        # Special actors
        dark_clouds = self.place_dark_clouds(segments, all_clouds, flags, rng)
        collectibles = self.place_collectibles(segments, all_clouds, flags, rng)
        ground_objects = self.place_ground_objects(target_x, outcome, target_payout, rng)
        
        # Black hole
        black_hole = None
        if flags.allow_black_hole:
            black_hole = self.place_black_hole(segments, all_clouds, target_payout,
                                              outcome['multiplier'], rng)
        
        # Build spawns list
        spawns = all_clouds + dark_clouds
        if black_hole:
            spawns.append(black_hole)
        
        # Score progression
        score_progression = self.generate_score_progression(target_y, target_payout)
        
        # Assemble
        script = {
            'spawns': spawns,
            'collectibles': collectibles,
            'groundObjects': ground_objects,
            'scoreProgression': score_progression,
            'stopAtY': int(target_y),
            'stopMethod': stop_method,
            'outcomeType': outcome['type'],
            'targetPayout': target_payout,
            'betAmount': effective_bet,
            'immediateDeath': outcome['type'] == 'dead' and target_payout == 0,
            'deathAnimation': 'implode' if outcome['type'] == 'dead' else None
        }
        
        session_id = hashlib.sha256(f"{seed}{time.time()}".encode()).hexdigest()[:16]
        
        print(f"✅ Generated: {outcome['type']} → ₹{target_payout}")
        print(f"   Control clouds: {len(control_clouds)}")
        print(f"   Ambient clouds: {len(ambient_clouds)}")
        print(f"   Collectibles: {len(collectibles)}")
        
        return {
            'sessionId': session_id,
            'seed': seed,
            'multiplier': outcome['multiplier'],
            'targetPayout': target_payout,
            'outcomeType': outcome['type'],
            'script': script,
            '_trajectory': trajectory,
            '_segments': segments
        }
    
    def _determine_target(self, outcome: Dict, rng) -> Tuple[float, float, str]:
        """Determine target position and stop method"""
        otype = outcome['type']
        
        if otype == 'dead':
            if outcome['multiplier'] == 0:
                return SCREEN_CENTER, 0, 'death'
            else:
                x = SCREEN_CENTER + (rng() - 0.5) * 400
                y = 8000 + rng() * 5000
                return x, y, 'trap'
        
        elif otype == 'low':
            if rng() < 0.5:
                x = SCREEN_CENTER + (rng() - 0.5) * 400
                y = 7000 + rng() * 6000
                return x, y, 'trap'
            else:
                x = SCREEN_CENTER + (rng() - 0.5) * 400
                return x, GROUND_COLLISION_Y, 'ground'
        
        elif otype == 'medium':
            x = SCREEN_CENTER + (rng() - 0.5) * 600
            return x, GROUND_COLLISION_Y, 'tank'
        
        elif otype == 'high':
            x = SCREEN_CENTER + (rng() - 0.5) * 500
            return x, GROUND_COLLISION_Y, 'camp'
        
        elif otype in ['jackpot', 'mega']:
            x = SCREEN_CENTER + (rng() - 0.5) * 400
            y = 10000 + rng() * 4000
            return x, y, 'blackhole'
        
        return SCREEN_CENTER, GROUND_COLLISION_Y, 'ground'
    
    def _generate_death_fallback(self, bet_amount: float,
                                 bonus_mode: bool) -> Dict:
        """Generate immediate death (fallback)"""
        seed = self.generate_seed()
        effective_bet = bet_amount * (10 if bonus_mode else 1)
        
        script = {
            'spawns': [],
            'collectibles': [],
            'groundObjects': [],
            'scoreProgression': [{'y': 0, 'score': 0}],
            'stopAtY': 0,
            'stopMethod': 'death',
            'outcomeType': 'dead',
            'targetPayout': 0,
            'betAmount': effective_bet,
            'immediateDeath': True,
            'deathAnimation': 'implode'
        }
        
        session_id = hashlib.sha256(f"{seed}{time.time()}".encode()).hexdigest()[:16]
        
        return {
            'sessionId': session_id,
            'seed': seed,
            'multiplier': 0,
            'targetPayout': 0,
            'outcomeType': 'dead',
            'script': script
        }
    
    # ========================================================================
    # HELPERS
    # ========================================================================
    
    def _ease(self, t: float) -> float:
        """Smooth easing"""
        return t * t * (3 - 2 * t)
    
    def _opposite_x(self, x: float, rng) -> float:
        """Get opposite side X"""
        if x < SCREEN_CENTER:
            return ENVELOPE_OUTER - 100 - rng() * 200
        return ENVELOPE_INNER + 100 + rng() * 200


# ============================================================================
# SINGLETON
# ============================================================================

_engine = GameEngine()

def generate_game(bet_amount: float, bonus_mode: bool = False) -> Dict:
    """Public API"""
    return _engine.generate_game(bet_amount, bonus_mode)