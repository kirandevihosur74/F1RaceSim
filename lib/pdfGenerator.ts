import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface SimulationData {
  totalTime?: number
  strategyAnalysis?: string
  simulationResults?: any[]
  strategy?: {
    name?: string
    pit_stops?: number[]
    tires?: string[]
    driver_style?: string
  }
  track?: {
    name?: string
  }
  weather?: string
}

export async function generateSimulationPDF_v2(
  data: SimulationData,
  chartElementId: string = 'simulation-chart'
): Promise<void> {
  try {
    // Debug: Log the data being passed
    console.log('PDF Generator v2 - Received data:', data)
    console.log('Strategy tires:', data.strategy?.tires)
    console.log('Strategy analysis:', data.strategyAnalysis)
    
    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    
    let yPosition = margin
    
    // Add title with better styling
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(220, 38, 38) // F1 Red color
    pdf.text('F1 Race Simulation Results', margin, yPosition)
    yPosition += 12
    
    // Add subtitle with better formatting
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100) // Gray color
    pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition)
    yPosition += 20
    
    // Reset text color to black
    pdf.setTextColor(0, 0, 0)
    
    // Add strategy information with better styling
    if (data.strategy) {
      // Add section background
      pdf.setFillColor(248, 250, 252) // Light gray background
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 25, 'F')
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 64, 175) // Blue color for headers
      pdf.text('Strategy Details', margin, yPosition)
      yPosition += 12
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0) // Reset to black
      
      if (data.strategy.name) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Strategy Name:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(data.strategy.name, margin + 35, yPosition)
        yPosition += 7
      }
      
      if (data.strategy.pit_stops && data.strategy.pit_stops.length > 0) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Pit Stops:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Lap ${data.strategy.pit_stops.join(', Lap ')}`, margin + 35, yPosition)
        yPosition += 7
      }
      
      if (data.strategy.tires && data.strategy.tires.length > 0) {
        const cleanTires = data.strategy.tires.map(tire => tire.replace(/[!'"]/g, '')).join(' → ')
        pdf.setFont('helvetica', 'bold')
        pdf.text('Tire Strategy:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(cleanTires, margin + 35, yPosition)
        yPosition += 7
      }
      
      if (data.strategy.driver_style) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Driver Style:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(data.strategy.driver_style.charAt(0).toUpperCase() + data.strategy.driver_style.slice(1), margin + 35, yPosition)
        yPosition += 7
      }
      
      yPosition += 15
    }
    
    // Add race conditions with better styling
    pdf.setFillColor(248, 250, 252)
    pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 20, 'F')
    
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30, 64, 175)
    pdf.text('Race Conditions', margin, yPosition)
    yPosition += 12
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    
    if (data.track?.name) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Track:', margin, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(data.track.name, margin + 35, yPosition)
      yPosition += 7
    }
    
    if (data.weather) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Weather:', margin, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(data.weather.charAt(0).toUpperCase() + data.weather.slice(1), margin + 35, yPosition)
      yPosition += 7
    }
    
    yPosition += 15
    
    // Add performance metrics with better styling
    if (data.totalTime) {
      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 30, 'F')
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 64, 175)
      pdf.text('Performance Metrics', margin, yPosition)
      yPosition += 12
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      pdf.setFont('helvetica', 'bold')
      pdf.text('Total Race Time:', margin, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${(data.totalTime / 60).toFixed(1)} minutes`, margin + 35, yPosition)
      yPosition += 7
      
      if (data.simulationResults && data.simulationResults.length > 0) {
        const avgLapTime = data.totalTime / data.simulationResults.length
        pdf.setFont('helvetica', 'bold')
        pdf.text('Average Lap Time:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(formatLapTime(avgLapTime), margin + 35, yPosition)
        yPosition += 7
        
        const bestLap = Math.min(...data.simulationResults.map(lap => lap.lap_time))
        pdf.setFont('helvetica', 'bold')
        pdf.text('Best Lap Time:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(formatLapTime(bestLap), margin + 35, yPosition)
        yPosition += 7
        
        const worstLap = Math.max(...data.simulationResults.map(lap => lap.lap_time))
        pdf.setFont('helvetica', 'bold')
        pdf.text('Worst Lap Time:', margin, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(formatLapTime(worstLap), margin + 35, yPosition)
        yPosition += 7
      }
      
      yPosition += 15
    }
    
    // Add strategy analysis with better styling
    if (data.strategyAnalysis) {
      console.log('Strategy analysis text:', data.strategyAnalysis)
      
      // Clean the strategy analysis text
      const cleanAnalysis = data.strategyAnalysis.replace(/[!'"]/g, '')
      console.log('Cleaned strategy analysis:', cleanAnalysis)
      
      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 25, 'F')
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 64, 175)
      pdf.text('Strategy Analysis', margin, yPosition)
      yPosition += 12
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      // Split long text into multiple lines
      const analysisLines = pdf.splitTextToSize(cleanAnalysis, contentWidth)
      pdf.text(analysisLines, margin, yPosition)
      yPosition += analysisLines.length * 5 + 15
    }
    
    // Check if we need a new page for the chart
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }
    
    // Add chart with better styling
    try {
      const chartElement = document.getElementById(chartElementId)
      if (chartElement) {
        // Add chart section header
        pdf.setFillColor(248, 250, 252)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 20, 'F')
        
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30, 64, 175)
        pdf.text('Lap Times Analysis Chart', margin, yPosition)
        yPosition += 15
        
        // Capture chart as image with higher quality
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 3, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: chartElement.scrollWidth,
          height: chartElement.scrollHeight
        })
        
        const imgData = canvas.toDataURL('image/png', 1.0) // Maximum quality
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        
        // Check if chart fits on current page
        if (yPosition + imgHeight > pageHeight - margin - 20) {
          pdf.addPage()
          yPosition = margin
        }
        
        // Add border around chart
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.5)
        pdf.rect(margin - 2, yPosition - 2, imgWidth + 4, imgHeight + 4)
        
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 15
      }
    } catch (chartError) {
      console.warn('Could not capture chart:', chartError)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Chart could not be included in PDF', margin, yPosition)
      yPosition += 10
    }
    
    // Add lap-by-lap data table if there's space
    if (data.simulationResults && data.simulationResults.length > 0 && yPosition < pageHeight - 50) {
      // Add table section header
      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 20, 'F')
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 64, 175)
      pdf.text('Lap-by-Lap Results', margin, yPosition)
      yPosition += 15
      
      // Add table headers with better styling
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      
      // Header background
      pdf.setFillColor(240, 240, 240)
      pdf.rect(margin, yPosition - 3, contentWidth, 8, 'F')
      
      pdf.text('Lap', margin + 2, yPosition)
      pdf.text('Lap Time', margin + 25, yPosition)
      pdf.text('Tire Wear', margin + 70, yPosition)
      pdf.text('Fuel Load', margin + 120, yPosition)
      yPosition += 8
      
      // Add table data with alternating row colors
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const maxRows = Math.floor((pageHeight - yPosition - margin - 20) / 6)
      const rowsToShow = Math.min(data.simulationResults.length, maxRows)
      
      for (let i = 0; i < rowsToShow; i++) {
        const lap = data.simulationResults[i]
        
        // Alternating row colors
        if (i % 2 === 0) {
          pdf.setFillColor(250, 250, 250)
          pdf.rect(margin, yPosition - 2, contentWidth, 6, 'F')
        }
        
        pdf.text(lap.lap.toString(), margin + 2, yPosition)
        pdf.text(formatLapTime(lap.lap_time), margin + 25, yPosition)
        pdf.text(`${lap.tire_wear}%`, margin + 70, yPosition)
        pdf.text(`${lap.fuel_load}L`, margin + 120, yPosition)
        yPosition += 6
      }
      
      if (data.simulationResults.length > maxRows) {
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(100, 100, 100)
        pdf.text(`... and ${data.simulationResults.length - maxRows} more laps`, margin + 2, yPosition)
      }
    }
    
    // Add footer with better styling
    const footerY = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(100, 100, 100)
    
    // Add footer line
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.5)
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    
    pdf.text('Generated by F1 Race Simulator', margin, footerY)
    pdf.text('www.f1racesim.com', pageWidth - margin - 50, footerY)
    
    // Save the PDF
    const fileName = `f1-simulation-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF report')
  }
}

function formatLapTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = (timeInSeconds % 60).toFixed(1).padStart(4, '0')
  return `${minutes}:${seconds}`
}
