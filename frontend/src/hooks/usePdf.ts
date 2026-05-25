import { jsPDF } from 'jspdf';
import { useConfigStore } from '../store/configStore';
import { useGridStore } from '../store/gridStore';
import { validarTurnoCelda } from './useShiftValidation';
import { ESPECIALIDADES_INDICES } from '../utils/constants/indices';

export const usePdf = () => {
  const { serviceKey, month, year, beds, nivel, dotacion, logoBase64 } = useConfigStore();
  const { personal, turnos, feriados } = useGridStore();

  const exportToPdf = () => {
    if (!dotacion) {
      alert('Error: Debe configurar la dotación primero.');
      return;
    }

    const currentSpecialty = ESPECIALIDADES_INDICES[serviceKey];
    const specialtyName = currentSpecialty ? currentSpecialty.especialidad : 'Servicio Desconocido';
    const totalDays = new Date(year, month, 0).getDate();

    // Create jsPDF instance: landscape, mm, a4
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Paginación inteligente: 15 enfermeros por página
    const itemsPerPage = 15;
    const totalPages = Math.ceil(personal.length / itemsPerPage) || 1;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        doc.addPage();
      }

      // --- ENCABEZADO ---
      // 1. Logo
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 15, 12, 12, 12);
        } catch (e) {
          // Fallback to default vector logo if invalid base64 format
          drawDefaultHospitalLogo(doc, 15, 12);
        }
      } else {
        drawDefaultHospitalLogo(doc, 15, 12);
      }

      // 2. Hospital info
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55); // #1f2937
      doc.text('HOSPITAL REGIONAL DE ALTA COMPLEJIDAD', 31, 17);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99); // #4b5563
      doc.text(`SERVICIO DE ${specialtyName.toUpperCase()}`, 31, 22);

      // 3. SADE branding
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(56, 189, 248); // Cyan Accent
      doc.text('SADE', 282, 17, { align: 'right' });
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(156, 163, 175); // #9ca3af
      doc.text('SISTEMA AUTOMATIZADO DE DOTACIÓN', 282, 21, { align: 'right' });

      // 4. Division line
      doc.setDrawColor(209, 213, 219); // #d1d5db
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(15, 27, 282, 27);
      doc.setLineDashPattern([], 0); // reset

      // 5. Metadata Row
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81); // #374151
      const metaText = `ÁREA: ${specialtyName}   |   PERÍODO: ${month.toString().padStart(2, '0')}/${year}   |   CAMAS: ${beds}   |   COMPLEJIDAD: ${nivel === 'tercero' ? '3er Nivel' : '2do Nivel'}`;
      doc.text(metaText, 15, 32);

      const reqText = `Z = ${dotacion.Z_ceil} (P: ${dotacion.P.toFixed(1)}, B: ${dotacion.B.toFixed(1)})   |   DISTRIBUCIÓN REQ: M:${dotacion.Q1} T:${dotacion.Q2} N:${dotacion.Q3}`;
      doc.text(reqText, 282, 32, { align: 'right' });

      // --- TABLA DE TURNOS ---
      const tableStartY = 37;
      const rowHeight = 7;
      const headerHeight = 8;
      
      // 1. Cabecera de la tabla
      doc.setFillColor(243, 244, 246); // #f3f4f6
      doc.rect(15, tableStartY, 267, headerHeight, 'F');
      doc.setDrawColor(209, 213, 219);
      doc.rect(15, tableStartY, 267, headerHeight, 'S');

      // Nombre column header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
      doc.text('Personal de Enfermería', 18, tableStartY + 5);

      // Vertical line after name
      doc.line(57, tableStartY, 57, tableStartY + headerHeight);

      // Day columns headers
      for (let day = 1; day <= 31; day++) {
        const xPos = 57 + (day - 1) * 6.5;
        if (day <= totalDays) {
          doc.text(day.toString(), xPos + 3.25, tableStartY + 5, { align: 'center' });
        }
        // Vertical divider line
        doc.line(xPos + 6.5, tableStartY, xPos + 6.5, tableStartY + headerHeight);
      }

      // Francos column header
      doc.text('Francos', 258.5 + 11.75, tableStartY + 5, { align: 'center' });

      // 2. Filas de enfermeros
      const pageStaff = personal.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
      
      pageStaff.forEach((enfermero, idx) => {
        const rowY = tableStartY + headerHeight + idx * rowHeight;
        
        // Alternating row background for legibility
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250); // very soft white
          doc.rect(15, rowY, 267, rowHeight, 'F');
        }

        // Row border
        doc.setDrawColor(229, 231, 235); // #e5e7eb
        doc.rect(15, rowY, 267, rowHeight, 'S');

        // Render Name and Level tag
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(31, 41, 55);
        const nameText = `${enfermero.apellido}, ${enfermero.nombre.substring(0, 1)}.`;
        doc.text(nameText, 17, rowY + 4.5);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(107, 114, 128); // #6b7280
        const levelShort = enfermero.nivel_formacion === 'AUXILIAR' ? 'AUX' : enfermero.nivel_formacion === 'ENFERMERO_ESPECIALISTA' ? 'ESP' : 'PE';
        doc.text(`[${levelShort}]`, 46, rowY + 4.5);

        // Divider after name
        doc.setDrawColor(209, 213, 219);
        doc.line(57, rowY, 57, rowY + rowHeight);

        // Day Cells for this employee
        let francosAsignadosCount = 0;
        const empTurnos = turnos[enfermero.id] || {};

        for (let day = 1; day <= 31; day++) {
          const xPos = 57 + (day - 1) * 6.5;

          if (day <= totalDays) {
            const shiftVal = empTurnos[day] || '';
            if (shiftVal === 'F') francosAsignadosCount++;

            // Check if day is weekend or holiday
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = feriados.includes(day);

            // Shading cell background
            if (isHoliday || isWeekend) {
              doc.setFillColor(243, 244, 246); // Light gray for weekend/feriados
              doc.rect(xPos, rowY, 6.5, rowHeight, 'F');
            }

            // Real-time validations
            const alertRes = validarTurnoCelda(enfermero.id, day, shiftVal, personal, turnos, feriados);

            if (alertRes) {
              if (alertRes.level === 'RED') {
                // RED -> B&W Friendly dark shading `#d1d5db` (30% gray)
                doc.setFillColor(209, 213, 219);
                doc.rect(xPos, rowY, 6.5, rowHeight, 'F');
              } else if (alertRes.level === 'ORANGE') {
                // ORANGE -> Medium light gray shading `#e5e7eb` (20% gray) + bold outline
                doc.setFillColor(229, 231, 235);
                doc.rect(xPos, rowY, 6.5, rowHeight, 'F');
              } else if (alertRes.level === 'YELLOW') {
                // YELLOW -> Subtle dotted border or light shading `#f3f4f6` (10% gray)
                doc.setFillColor(243, 244, 246);
                doc.rect(xPos, rowY, 6.5, rowHeight, 'F');
              }
            }

            // Cell border
            doc.setDrawColor(229, 231, 235);
            doc.rect(xPos, rowY, 6.5, rowHeight, 'S');

            // Draw shift value
            if (shiftVal) {
              doc.setFont('Courier', 'bold');
              doc.setFontSize(8.5);

              // Set text color according to alert / B&W friendly contrasting
              if (alertRes?.level === 'RED') {
                doc.setTextColor(0, 0, 0); // Black contrast on gray
              } else if (shiftVal === 'F') {
                doc.setTextColor(16, 124, 65); // Green for Francos
              } else {
                doc.setTextColor(31, 41, 55);
              }

              // Draw shift code
              doc.text(shiftVal, xPos + 3.25, rowY + 4.75, { align: 'center' });
            }
          } else {
            // Out of bounds days (e.g. Feb 30th/31st) -> shade completely dark
            doc.setFillColor(229, 231, 235);
            doc.rect(xPos, rowY, 6.5, rowHeight, 'F');
          }

          // Vertical divider line
          doc.setDrawColor(209, 213, 219);
          doc.line(xPos + 6.5, rowY, xPos + 6.5, rowY + rowHeight);
        }

        // Francos Assigned / Meta
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        
        // Calculate dynamic target francos
        const baseFrancos = totalDays === 31 ? 9 : 8;
        const targetFrancos = baseFrancos + feriados.length + (enfermero.compensatorio_pendiente || 0);

        if (francosAsignadosCount >= targetFrancos) {
          doc.setTextColor(16, 124, 65); // green
        } else {
          doc.setTextColor(194, 65, 12); // orange/red
        }
        
        doc.text(`${francosAsignadosCount}/${targetFrancos}`, 258.5 + 11.75, rowY + 4.5, { align: 'center' });
      });

      // --- PIE DE PÁGINA ---
      // Page Number
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Página ${page + 1} de ${totalPages}`, 148.5, 203, { align: 'center' });

      // Emitted Date timestamp
      const localDateStr = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generado por SADE el ${localDateStr}`, 15, 203);

      // On the LAST page, draw the LEGEND and SIGNATURE BLOCKS!
      if (page === totalPages - 1) {
        const legendY = tableStartY + headerHeight + pageStaff.length * rowHeight + 6;

        // 1. Drawing legend of cell alerts/shifts
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(75, 85, 99);
        doc.text('REFERENCIAS:', 15, legendY);

        doc.setFont('Helvetica', 'normal');
        doc.text('M: Mañana (06-14hs)  |  T: Tarde (14-22hs)  |  N: Noche (22-06hs)  |  F: Franco (Descanso Ordinario)', 38, legendY);
        
        // Draw sutil warning boxes representation
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(209, 213, 219); // Gray Red
        doc.rect(170, legendY - 2, 4, 3, 'F');
        doc.rect(170, legendY - 2, 4, 3, 'S');
        doc.text('Restricción Crítica (Rojo)', 176, legendY);

        doc.setFillColor(229, 231, 235); // Gray Orange
        doc.rect(215, legendY - 2, 4, 3, 'F');
        doc.rect(215, legendY - 2, 4, 3, 'S');
        doc.text('Descanso Mín. (Naranja)', 221, legendY);

        // 2. Drawing Signature Blocks
        const sigBlockY = legendY + 12;

        doc.setDrawColor(209, 213, 219);
        doc.setLineDashPattern([1, 1], 0);

        // Jefe de Servicio block
        doc.line(40, sigBlockY + 14, 110, sigBlockY + 14);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        doc.text('Lic. Lionel Messi', 75, sigBlockY + 18, { align: 'center' });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text('Firma y Aclaración - Jefe de Servicio', 75, sigBlockY + 22, { align: 'center' });

        // Director Médico block
        doc.line(180, sigBlockY + 14, 250, sigBlockY + 14);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        doc.text('Dra. Antonela Roccuzzo', 215, sigBlockY + 18, { align: 'center' });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text('Firma y Aclaración - Director Médico', 215, sigBlockY + 22, { align: 'center' });

        doc.setLineDashPattern([], 0); // reset
      }
    }

    // Save document
    const filename = `SADE_Planilla_${specialtyName.replace(/\s+/g, '_')}_${month.toString().padStart(2, '0')}_${year}.pdf`;
    doc.save(filename);
  };

  return { exportToPdf };
};

// Helper: Vectorial drawing of a stunning default hospital logo in PDF
function drawDefaultHospitalLogo(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(56, 189, 248); // Cyan
  doc.setFillColor(243, 244, 246); // Light gray
  doc.rect(x, y, 12, 12, 'F');
  
  doc.setFillColor(56, 189, 248); // Cyan cross
  doc.rect(x + 5, y + 2.5, 2, 7, 'F');
  doc.rect(x + 2.5, y + 5, 7, 2, 'F');

  // Decorative corners for high tech feel
  doc.setLineWidth(0.3);
  doc.line(x, y, x + 2, y);
  doc.line(x, y, x, y + 2);
  
  doc.line(x + 10, y, x + 12, y);
  doc.line(x + 12, y, x + 12, y + 2);

  doc.line(x, y + 12, x + 2, y + 12);
  doc.line(x, y + 10, x, y + 12);

  doc.line(x + 10, y + 12, x + 12, y + 12);
  doc.line(x + 12, y + 10, x + 12, y + 12);
}
