import { describe, expect, it } from 'vitest';
import { classifyAqi, evaluateSmogInversion } from '@/services/aqi-service';
import { AQI_THRESHOLDS, WINTER_INVERSION_THRESHOLDS } from '@/config/constants';

describe('AQI Classification & Meteorological Inversion Unit Tests', () => {
  describe('classifyAqi boundary tests', () => {
    it('classifies 0 as Good', () => {
      const res = classifyAqi(0);
      expect(res.category).toBe('good');
      expect(res.label).toBe('Good');
    });

    it('classifies 50 as Good boundary', () => {
      const res = classifyAqi(AQI_THRESHOLDS.GOOD_MAX);
      expect(res.category).toBe('good');
    });

    it('classifies 51 as Moderate boundary', () => {
      const res = classifyAqi(51);
      expect(res.category).toBe('moderate');
      expect(res.label).toBe('Moderate');
    });

    it('classifies 100 as Moderate upper boundary', () => {
      const res = classifyAqi(AQI_THRESHOLDS.MODERATE_MAX);
      expect(res.category).toBe('moderate');
    });

    it('classifies 101 as Unhealthy for Sensitive Groups', () => {
      const res = classifyAqi(101);
      expect(res.category).toBe('unhealthy-sensitive');
      expect(res.label).toBe('Unhealthy for Sensitive Groups');
    });

    it('classifies 150 as Unhealthy for Sensitive Groups upper boundary', () => {
      const res = classifyAqi(AQI_THRESHOLDS.UNHEALTHY_SENSITIVE_MAX);
      expect(res.category).toBe('unhealthy-sensitive');
    });

    it('classifies 151 as Unhealthy lower boundary', () => {
      const res = classifyAqi(151);
      expect(res.category).toBe('unhealthy');
      expect(res.label).toBe('Unhealthy');
    });

    it('classifies 200 as Unhealthy upper boundary', () => {
      const res = classifyAqi(AQI_THRESHOLDS.UNHEALTHY_MAX);
      expect(res.category).toBe('unhealthy');
    });

    it('classifies 201 as Very Unhealthy lower boundary', () => {
      const res = classifyAqi(201);
      expect(res.category).toBe('very-unhealthy');
      expect(res.label).toBe('Very Unhealthy');
    });

    it('classifies 300 as Very Unhealthy upper boundary', () => {
      const res = classifyAqi(AQI_THRESHOLDS.VERY_UNHEALTHY_MAX);
      expect(res.category).toBe('very-unhealthy');
    });

    it('classifies 301 as Hazardous lower boundary', () => {
      const res = classifyAqi(AQI_THRESHOLDS.HAZARDOUS_MIN);
      expect(res.category).toBe('hazardous');
      expect(res.label).toBe('Hazardous');
    });

    it('classifies extreme values like 500 and 999 as Hazardous', () => {
      expect(classifyAqi(500).category).toBe('hazardous');
      expect(classifyAqi(999).category).toBe('hazardous');
    });
  });

  describe('evaluateSmogInversion dynamic meteorological tests', () => {
    it('activates inversion when boundary layer < 250m and wind <= 5 km/h', () => {
      const res = evaluateSmogInversion(3.0, 180, 120);
      expect(res.isInversionActive).toBe(true);
      expect(res.dispersionIndex).toBeGreaterThan(0);
    });

    it('deactivates inversion when wind speed exceeds stagnant threshold (> 5 km/h)', () => {
      const res = evaluateSmogInversion(8.0, 180, 120);
      expect(res.isInversionActive).toBe(false);
    });

    it('deactivates inversion when boundary layer height reaches or exceeds 250m', () => {
      const res = evaluateSmogInversion(3.0, 300, 120);
      expect(res.isInversionActive).toBe(false);
    });

    it('deactivates inversion at exact threshold boundary (boundaryLayer = 250m)', () => {
      const res = evaluateSmogInversion(
        WINTER_INVERSION_THRESHOLDS.STAGNANT_WIND_SPEED_KMH,
        WINTER_INVERSION_THRESHOLDS.CRITICAL_BOUNDARY_LAYER_METERS,
        100
      );
      expect(res.isInversionActive).toBe(false);
    });

    it('escalates to critical risk when inversion is active and AQI > 150', () => {
      const res = evaluateSmogInversion(2.0, 150, 175);
      expect(res.isInversionActive).toBe(true);
      expect(res.smogRiskLevel).toBe('critical');
    });

    it('escalates to critical risk when AQI > 300 regardless of inversion state', () => {
      const resWithoutInversion = evaluateSmogInversion(15.0, 800, 350);
      expect(resWithoutInversion.isInversionActive).toBe(false);
      expect(resWithoutInversion.smogRiskLevel).toBe('critical');
    });

    it('assigns severe risk when inversion is active but AQI <= 150', () => {
      const res = evaluateSmogInversion(4.0, 200, 95);
      expect(res.isInversionActive).toBe(true);
      expect(res.smogRiskLevel).toBe('severe');
    });

    it('assigns severe risk when AQI > 200 without active inversion', () => {
      const res = evaluateSmogInversion(10.0, 500, 220);
      expect(res.isInversionActive).toBe(false);
      expect(res.smogRiskLevel).toBe('severe');
    });

    it('assigns moderate risk when AQI is between 101 and 200 with no inversion', () => {
      const res = evaluateSmogInversion(10.0, 600, 130);
      expect(res.isInversionActive).toBe(false);
      expect(res.smogRiskLevel).toBe('moderate');
    });

    it('assigns low risk when AQI <= 100 and no inversion is present', () => {
      const res = evaluateSmogInversion(12.0, 800, 45);
      expect(res.isInversionActive).toBe(false);
      expect(res.smogRiskLevel).toBe('low');
    });

    it('accurately computes ventilation/dispersion index formula', () => {
      // wind = 3.6 km/h = 1.0 m/s; boundaryLayer = 200m; dispersionIndex = (1.0 * 200) / 100 = 2.00
      const res = evaluateSmogInversion(3.6, 200, 50);
      expect(res.dispersionIndex).toBe(2.0);
    });
  });
});
