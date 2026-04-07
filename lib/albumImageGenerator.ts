/**
 * Genera una imagen resumen del álbum usando Canvas API
 * @param album - Datos del álbum
 * @param songs - Canciones calificadas del álbum
 * @param artistEntries - Todas las entradas del artista
 * @returns Promise<Blob> - Imagen PNG
 */
export async function generateAlbumImage(
  album: { title: string; artist: string; coverUrl: string; rating: number; date: string },
  songs: Array<{ title: string; rating: number }>,
  artistEntries: Array<{ rating: number }>
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');

  // Configurar tamaño (1080x1920 para historia de Instagram)
  canvas.width = 1080;
  canvas.height = 1920;

  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#581c87');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Cargar imagen de portada
  const coverImg = await loadImage(album.coverUrl);
  
  // Header section
  const headerY = 48;
  
  // Dibujar portada (256x256)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(48, headerY, 256, 256, 12);
  ctx.clip();
  ctx.drawImage(coverImg, 48, headerY, 256, 256);
  ctx.restore();
  
  // Borde de portada
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(48, headerY, 256, 256, 12);
  ctx.stroke();

  // Título del álbum (con truncamiento si es muy largo)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  
  let displayTitle = album.title;
  const titleWidth = ctx.measureText(displayTitle).width;
  const maxTitleWidth = 680;
  
  if (titleWidth > maxTitleWidth) {
    // Truncar título y agregar "..."
    while (ctx.measureText(displayTitle + '...').width > maxTitleWidth && displayTitle.length > 0) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle = displayTitle + '...';
  }
  
  ctx.fillText(displayTitle, 336, headerY + 50);
  
  // Artista (posicionado fijo debajo del título)
  const artistY = headerY + 120;
  ctx.fillStyle = '#d8b4fe';
  ctx.font = 'italic 28px system-ui, -apple-system, sans-serif';
  ctx.fillText(album.artist, 336, artistY);

  // Rating grande (alineado sin estrella)
  const ratingY = artistY + 50;
  
  // Calcular posiciones con medidas exactas - TODO DEL MISMO TAMAÑO
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  const ratingText = album.rating.toFixed(1);
  const ratingWidth = ctx.measureText(ratingText).width;
  
  // Dibujar número del rating
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ratingText, 336, ratingY + 18);
  
  // Dibujar /10 del MISMO tamaño
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  const slashText = '/10';
  const slashX = 336 + ratingWidth + 8;
  ctx.fillText(slashText, slashX, ratingY + 18);

  // Estadísticas (solo canciones calificadas, subido)
  const statsY = ratingY + 60;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${songs.length} canciones calificadas`, 336, statsY);

  // Sección de gráfica
  const chartY = ratingY + 120;
  const chartHeight = 480;
  const chartX = 48;
  const chartWidth = 984;

  // Fondo de gráfica
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(chartX, chartY, chartWidth, chartHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Título de gráfica
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('Distribución de Ratings', chartX + 24, chartY + 40);

  // Dibujar gráfica si hay datos
  if (songs.length > 0) {
    drawChart(ctx, songs, chartX, chartY + 60, chartWidth, chartHeight - 80, album.rating);
  }

  // Lista de canciones debajo de la gráfica (más separada)
  const listStartY = chartY + chartHeight + 50;
  const itemHeight = 60;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Canciones calificadas:', 48, listStartY);
  
  songs.forEach((song, index) => {
    const yPos = listStartY + 55 + (index * itemHeight);
    
    // Número de track (usar trackNumber si existe, sino usar index)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const trackNum = (song as any).trackNumber || (index + 1);
    ctx.fillText(`#${trackNum}`, 100, yPos);
    
    // Nombre de la canción (más grande)
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    let displayName = song.title;
    if (displayName.length > 45) {
      displayName = displayName.substring(0, 42) + '...';
    }
    ctx.fillText(displayName, 120, yPos);
    
    // Rating sin estrella
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(song.rating.toFixed(1), 1020, yPos);
  });

  // Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const date = new Date(album.date).toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  ctx.fillText(`Dashie's music blog • ${date}`, 540, 1880);
  ctx.textAlign = 'left';

  // Convertir a Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Error al generar la imagen'));
      }
    }, 'image/png');
  });
}

/**
 * Carga una imagen desde URL con CORS
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Dibuja texto con wrap automático y retorna número de líneas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 1;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return lineCount;
}

/**
 * Dibuja una estrella
 */
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const spikes = 5;
  const outerRadius = radius;
  const innerRadius = radius / 2;
  
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  
  ctx.closePath();
  ctx.fillStyle = '#facc15';
  ctx.fill();
  ctx.restore();
}

/**
 * Dibuja la gráfica de líneas
 */
function drawChart(
  ctx: CanvasRenderingContext2D,
  songs: Array<{ title: string; rating: number }>,
  x: number,
  y: number,
  width: number,
  height: number,
  albumRating: number
) {
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Dibujar grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  // Líneas horizontales
  for (let i = 0; i <= 10; i += 2) {
    const yPos = y + padding.top + chartHeight - (i / 10) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(x + padding.left, yPos);
    ctx.lineTo(x + padding.left + chartWidth, yPos);
    ctx.stroke();
    
    // Labels del eje Y
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(i.toString(), x + padding.left - 12, yPos + 5);
  }

  // Dibujar línea de datos
  if (songs.length > 1) {
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    songs.forEach((song, index) => {
      const xPos = x + padding.left + (index / (songs.length - 1)) * chartWidth;
      const yPos = y + padding.top + chartHeight - (song.rating / 10) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(xPos, yPos);
      } else {
        ctx.lineTo(xPos, yPos);
      }
    });
    
    ctx.stroke();

    // Dibujar puntos (sin ratings)
    songs.forEach((song, index) => {
      const xPos = x + padding.left + (index / (songs.length - 1)) * chartWidth;
      const yPos = y + padding.top + chartHeight - (song.rating / 10) * chartHeight;
      
      // Círculo
      ctx.beginPath();
      ctx.arc(xPos, yPos, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#a78bfa';
      ctx.fill();
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  } else if (songs.length === 1) {
    // Solo una canción
    const xPos = x + padding.left + chartWidth / 2;
    const yPos = y + padding.top + chartHeight - (songs[0].rating / 10) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(xPos, yPos, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#a78bfa';
    ctx.fill();
  }

  // Línea de referencia del álbum
  const albumY = y + padding.top + chartHeight - (albumRating / 10) * chartHeight;
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x + padding.left, albumY);
  ctx.lineTo(x + padding.left + chartWidth, albumY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label de la línea
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Álbum: ${albumRating.toFixed(1)}`, x + padding.left + 10, albumY - 12);

  // Labels del eje X (solo números de track)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  
  songs.forEach((_, index) => {
    const xPos = x + padding.left + (index / Math.max(songs.length - 1, 1)) * chartWidth;
    ctx.fillText(`#${index + 1}`, xPos, y + padding.top + chartHeight + 25);
  });
}
