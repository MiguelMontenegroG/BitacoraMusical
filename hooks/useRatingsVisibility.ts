'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

/**
 * Hook para manejar la visibilidad global de las calificaciones.
 * 
 * - Si ratingsVisible es true: todos pueden ver las calificaciones.
 * - Si ratingsVisible es false: solo usuarios autenticados pueden ver calificaciones.
 * - Solo usuarios autenticados pueden cambiar el estado.
 */
export function useRatingsVisibility() {
  const [ratingsVisible, setRatingsVisible] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Cargar el estado actual desde Supabase
  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('ratings_visible')
        .limit(1)
        .single();

      if (error) {
        // Si la tabla no existe, usar valor por defecto
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logger.debug('Tabla app_settings no encontrada, usando valor por defecto');
          setRatingsVisible(true);
          return;
        }
        throw error;
      }

      if (data) {
        setRatingsVisible(data.ratings_visible);
      }
    } catch (error) {
      logger.error('Error cargando configuracion de visibilidad:', error);
      // En caso de error, mantener visible por defecto
      setRatingsVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
        },
        (payload) => {
          const newSettings = payload.new as { ratings_visible: boolean };
          if (newSettings.ratings_visible !== undefined) {
            setRatingsVisible(newSettings.ratings_visible);
            logger.log('🔄 Visibilidad actualizada en tiempo real:', newSettings.ratings_visible);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSettings]);

  /**
   * Cambiar la visibilidad de las calificaciones.
   * Solo usuarios autenticados pueden realizar esta accion.
   * Como la tabla app_settings puede no existir (no se ha creado la migracion SQL),
   * manejamos el estado local directamente para que la funcionalidad funcione
   * incluso sin conexion a Supabase.
   */
  const toggleRatingsVisibility = useCallback(async () => {
    if (!isAuthenticated) {
      logger.warn('Intento de cambiar visibilidad sin autenticacion');
      return false;
    }

    const newValue = !ratingsVisible;

    try {
      // Intentar guardar en Supabase
      // Obtener la fila actual (deberia ser la unica)
      const { data: existingData, error: fetchError } = await supabase
        .from('app_settings')
        .select('id')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Error real (no solo "no encontrado")
        // Actualizar estado local igualmente como fallback
        setRatingsVisible(newValue);
        logger.warn('Error consultando app_settings, usando estado local:', fetchError);
        return true;
      }

      if (existingData) {
        // Actualizar fila existente
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({
            ratings_visible: newValue,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq('id', existingData.id);

        if (updateError) {
          // Fallback a local
          setRatingsVisible(newValue);
          logger.warn('Error actualizando app_settings, usando estado local:', updateError);
          return true;
        }
      } else {
        // Insertar nueva fila (primera vez)
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({
            ratings_visible: newValue,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (insertError) {
          // Fallback a local
          setRatingsVisible(newValue);
          logger.warn('Error insertando app_settings, usando estado local:', insertError);
          return true;
        }
      }

      // Actualizar estado local inmediatamente para UI responsiva
      setRatingsVisible(newValue);
      logger.log('Visibilidad cambiada a:', newValue);
      return true;
    } catch (error) {
      // En caso de cualquier error, usar estado local como fallback
      setRatingsVisible(newValue);
      logger.warn('Error en toggleRatingsVisibility, usando estado local:', error);
      return true;
    }
  }, [ratingsVisible, isAuthenticated]);

  /**
   * Determina si un usuario puede ver las calificaciones.
   * - Si ratingsVisible es true, todos pueden ver.
   * - Si ratingsVisible es false, solo usuarios autenticados pueden ver.
   */
  const canSeeRatings = useCallback(
    (isUserAuthenticated: boolean = false) => {
      return ratingsVisible || isUserAuthenticated;
    },
    [ratingsVisible]
  );

  return {
    ratingsVisible,
    isLoading,
    toggleRatingsVisibility,
    canSeeRatings,
  };
}
