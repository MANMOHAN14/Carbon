import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface ProjectData {
  id: string
  ecosystem: string
  area: number
  location: { latitude: number; longitude: number }
  plantingData: any[]
  growthData: any[]
  environmentalData: any[]
  satelliteData: any[]
}

interface VerificationResult {
  isVerified: boolean
  confidence: number
  carbonSequestration: number
  biomassEstimate: number
  growthRate: number
  environmentalHealth: number
  riskFactors: string[]
  recommendations: string[]
  complianceScore: number
}

interface AIModelPrediction {
  carbonSequestration: number
  biomass: number
  growthRate: number
  healthScore: number
  confidence: number
}

class AIProjectVerification {
  private modelEndpoint: string
  private tensorflowModel: string
  private pytorchModel: string

  constructor() {
    this.modelEndpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:8000'
    this.tensorflowModel = 'blue-carbon-tensorflow-v1'
    this.pytorchModel = 'blue-carbon-pytorch-v1'
  }

  /**
   * Main verification function that uses AI models to verify project data
   */
  async verifyProject(projectId: string): Promise<VerificationResult> {
    try {
      console.log(`🤖 Starting AI verification for project ${projectId}`)

      // Fetch project data
      const projectData = await this.fetchProjectData(projectId)
      
      // Run AI models
      const tensorflowPrediction = await this.runTensorFlowModel(projectData)
      const pytorchPrediction = await this.runPyTorchModel(projectData)
      
      // Combine predictions
      const combinedPrediction = this.combinePredictions(tensorflowPrediction, pytorchPrediction)
      
      // Perform verification checks
      const verificationResult = await this.performVerificationChecks(projectData, combinedPrediction)
      
      // Store verification result
      await this.storeVerificationResult(projectId, verificationResult)
      
      return verificationResult

    } catch (error) {
      console.error('❌ Error in AI project verification:', error)
      return this.getDefaultVerificationResult()
    }
  }

  /**
   * TensorFlow model for carbon sequestration prediction
   */
  private async runTensorFlowModel(projectData: ProjectData): Promise<AIModelPrediction> {
    try {
      console.log('🧠 Running TensorFlow model for carbon sequestration')

      const features = this.extractFeatures(projectData)
      
      const response = await axios.post(`${this.modelEndpoint}/tensorflow/predict`, {
        model: this.tensorflowModel,
        features: features,
        project_type: projectData.ecosystem
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_TOKEN}`
        }
      })

      return {
        carbonSequestration: response.data.carbon_sequestration,
        biomass: response.data.biomass,
        growthRate: response.data.growth_rate,
        healthScore: response.data.health_score,
        confidence: response.data.confidence
      }

    } catch (error) {
      console.error('❌ TensorFlow model error:', error)
      return this.getDefaultPrediction()
    }
  }

  /**
   * PyTorch model for ecosystem health assessment
   */
  private async runPyTorchModel(projectData: ProjectData): Promise<AIModelPrediction> {
    try {
      console.log('🔥 Running PyTorch model for ecosystem health')

      const features = this.extractFeatures(projectData)
      
      const response = await axios.post(`${this.modelEndpoint}/pytorch/predict`, {
        model: this.pytorchModel,
        features: features,
        ecosystem_type: projectData.ecosystem,
        area: projectData.area,
        location: projectData.location
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_TOKEN}`
        }
      })

      return {
        carbonSequestration: response.data.carbon_sequestration,
        biomass: response.data.biomass,
        growthRate: response.data.growth_rate,
        healthScore: response.data.health_score,
        confidence: response.data.confidence
      }

    } catch (error) {
      console.error('❌ PyTorch model error:', error)
      return this.getDefaultPrediction()
    }
  }

  /**
   * Extract features for AI models
   */
  private extractFeatures(projectData: ProjectData): any {
    const features = {
      // Basic project features
      ecosystem_type: this.encodeEcosystem(projectData.ecosystem),
      area: projectData.area,
      latitude: projectData.location.latitude,
      longitude: projectData.location.longitude,
      
      // Planting data features
      species_count: projectData.plantingData.length,
      planting_density: this.calculatePlantingDensity(projectData),
      species_diversity: this.calculateSpeciesDiversity(projectData),
      
      // Growth data features
      avg_height: this.calculateAverageHeight(projectData.growthData),
      avg_diameter: this.calculateAverageDiameter(projectData.growthData),
      growth_rate: this.calculateGrowthRate(projectData.growthData),
      survival_rate: this.calculateSurvivalRate(projectData),
      
      // Environmental features
      water_quality: this.getWaterQuality(projectData.environmentalData),
      soil_quality: this.getSoilQuality(projectData.environmentalData),
      air_quality: this.getAirQuality(projectData.environmentalData),
      
      // Satellite features
      vegetation_index: this.getVegetationIndex(projectData.satelliteData),
      area_change: this.getAreaChange(projectData.satelliteData),
      deforestation_risk: this.getDeforestationRisk(projectData.satelliteData),
      
      // Temporal features
      project_age: this.calculateProjectAge(projectData),
      data_frequency: this.calculateDataFrequency(projectData),
      seasonal_variation: this.calculateSeasonalVariation(projectData)
    }

    return features
  }

  /**
   * Combine predictions from multiple models
   */
  private combinePredictions(tf: AIModelPrediction, pytorch: AIModelPrediction): AIModelPrediction {
    // Weighted average based on confidence
    const tfWeight = tf.confidence / (tf.confidence + pytorch.confidence)
    const pytorchWeight = pytorch.confidence / (tf.confidence + pytorch.confidence)

    return {
      carbonSequestration: tf.carbonSequestration * tfWeight + pytorch.carbonSequestration * pytorchWeight,
      biomass: tf.biomass * tfWeight + pytorch.biomass * pytorchWeight,
      growthRate: tf.growthRate * tfWeight + pytorch.growthRate * pytorchWeight,
      healthScore: tf.healthScore * tfWeight + pytorch.healthScore * pytorchWeight,
      confidence: (tf.confidence + pytorch.confidence) / 2
    }
  }

  /**
   * Perform comprehensive verification checks
   */
  private async performVerificationChecks(
    projectData: ProjectData, 
    prediction: AIModelPrediction
  ): Promise<VerificationResult> {
    const checks = {
      dataQuality: this.checkDataQuality(projectData),
      growthConsistency: this.checkGrowthConsistency(projectData.growthData),
      environmentalHealth: this.checkEnvironmentalHealth(projectData.environmentalData),
      satelliteConsistency: this.checkSatelliteConsistency(projectData.satelliteData),
      carbonCalculation: this.validateCarbonCalculation(prediction),
      complianceCheck: await this.checkNCCRCompliance(projectData)
    }

    const overallScore = Object.values(checks).reduce((sum, score) => sum + score, 0) / Object.keys(checks).length

    const riskFactors = this.identifyRiskFactors(projectData, prediction)
    const recommendations = this.generateRecommendations(projectData, prediction, checks)

    return {
      isVerified: overallScore >= 0.7 && prediction.confidence >= 0.6,
      confidence: prediction.confidence,
      carbonSequestration: prediction.carbonSequestration,
      biomassEstimate: prediction.biomass,
      growthRate: prediction.growthRate,
      environmentalHealth: prediction.healthScore,
      riskFactors,
      recommendations,
      complianceScore: overallScore
    }
  }

  // Helper methods for feature extraction
  private encodeEcosystem(ecosystem: string): number {
    const ecosystemMap: { [key: string]: number } = {
      'mangrove': 1,
      'seagrass': 2,
      'salt_marsh': 3,
      'coastal_wetland': 4
    }
    return ecosystemMap[ecosystem] || 0
  }

  private calculatePlantingDensity(projectData: ProjectData): number {
    return projectData.plantingData.length / projectData.area
  }

  private calculateSpeciesDiversity(projectData: ProjectData): number {
    const species = new Set(projectData.plantingData.map(p => p.species))
    return species.size
  }

  private calculateAverageHeight(growthData: any[]): number {
    if (growthData.length === 0) return 0
    return growthData.reduce((sum, data) => sum + (data.height || 0), 0) / growthData.length
  }

  private calculateAverageDiameter(growthData: any[]): number {
    if (growthData.length === 0) return 0
    return growthData.reduce((sum, data) => sum + (data.diameter || 0), 0) / growthData.length
  }

  private calculateGrowthRate(growthData: any[]): number {
    if (growthData.length < 2) return 0
    
    const sorted = growthData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    
    const timeDiff = (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / (1000 * 60 * 60 * 24 * 365)
    const heightDiff = (last.height || 0) - (first.height || 0)
    
    return timeDiff > 0 ? heightDiff / timeDiff : 0
  }

  private calculateSurvivalRate(projectData: ProjectData): number {
    const planted = projectData.plantingData.length
    const surviving = projectData.growthData.filter(g => g.health_score > 0.5).length
    return planted > 0 ? surviving / planted : 0
  }

  private getWaterQuality(environmentalData: any[]): number {
    const waterData = environmentalData.filter(d => d.type === 'water_quality')
    if (waterData.length === 0) return 0.5
    
    const avgPH = waterData.reduce((sum, d) => sum + (d.ph || 7), 0) / waterData.length
    const avgDO = waterData.reduce((sum, d) => sum + (d.dissolved_oxygen || 5), 0) / waterData.length
    
    return Math.min(1, (avgPH / 8.5 + avgDO / 10) / 2)
  }

  private getSoilQuality(environmentalData: any[]): number {
    const soilData = environmentalData.filter(d => d.type === 'soil')
    if (soilData.length === 0) return 0.5
    
    const avgPH = soilData.reduce((sum, d) => sum + (d.ph || 6.5), 0) / soilData.length
    const avgOM = soilData.reduce((sum, d) => sum + (d.organic_matter || 3), 0) / soilData.length
    
    return Math.min(1, (avgPH / 7.5 + avgOM / 8) / 2)
  }

  private getAirQuality(environmentalData: any[]): number {
    const airData = environmentalData.filter(d => d.type === 'air_quality')
    if (airData.length === 0) return 0.5
    
    const avgCO2 = airData.reduce((sum, d) => sum + (d.co2 || 400), 0) / airData.length
    return Math.max(0, Math.min(1, (450 - avgCO2) / 50))
  }

  private getVegetationIndex(satelliteData: any[]): number {
    if (satelliteData.length === 0) return 0.5
    return satelliteData.reduce((sum, d) => sum + (d.vegetation_index || 0.5), 0) / satelliteData.length
  }

  private getAreaChange(satelliteData: any[]): number {
    if (satelliteData.length < 2) return 0
    
    const sorted = satelliteData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const first = sorted[0].area_calculation || 0
    const last = sorted[sorted.length - 1].area_calculation || 0
    
    return first > 0 ? (last - first) / first : 0
  }

  private getDeforestationRisk(satelliteData: any[]): number {
    // Calculate deforestation risk based on vegetation index trends
    if (satelliteData.length < 3) return 0.1
    
    const recentData = satelliteData.slice(-3)
    const trend = recentData.reduce((sum, d, i) => {
      if (i === 0) return 0
      return sum + (d.vegetation_index - recentData[i-1].vegetation_index)
    }, 0) / (recentData.length - 1)
    
    return Math.max(0, Math.min(1, -trend * 10))
  }

  private calculateProjectAge(projectData: ProjectData): number {
    if (projectData.plantingData.length === 0) return 0
    
    const oldestPlanting = Math.min(...projectData.plantingData.map(p => new Date(p.timestamp).getTime()))
    return (Date.now() - oldestPlanting) / (1000 * 60 * 60 * 24 * 365)
  }

  private calculateDataFrequency(projectData: ProjectData): number {
    const allData = [...projectData.growthData, ...projectData.environmentalData]
    if (allData.length < 2) return 0
    
    const timeSpan = Math.max(...allData.map(d => new Date(d.timestamp).getTime())) - 
                    Math.min(...allData.map(d => new Date(d.timestamp).getTime()))
    const timeSpanDays = timeSpan / (1000 * 60 * 60 * 24)
    
    return timeSpanDays > 0 ? allData.length / timeSpanDays : 0
  }

  private calculateSeasonalVariation(projectData: ProjectData): number {
    // Calculate seasonal variation in growth data
    const monthlyGrowth = new Array(12).fill(0)
    const monthlyCounts = new Array(12).fill(0)
    
    projectData.growthData.forEach(d => {
      const month = new Date(d.timestamp).getMonth()
      monthlyGrowth[month] += d.height || 0
      monthlyCounts[month]++
    })
    
    const monthlyAverages = monthlyGrowth.map((sum, i) => 
      monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0
    )
    
    const mean = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12
    const variance = monthlyAverages.reduce((sum, avg) => sum + Math.pow(avg - mean, 2), 0) / 12
    
    return Math.sqrt(variance)
  }

  // Verification check methods
  private checkDataQuality(projectData: ProjectData): number {
    let score = 0
    let checks = 0
    
    // Check data completeness
    if (projectData.plantingData.length > 0) { score += 0.25; checks++ }
    if (projectData.growthData.length > 0) { score += 0.25; checks++ }
    if (projectData.environmentalData.length > 0) { score += 0.25; checks++ }
    if (projectData.satelliteData.length > 0) { score += 0.25; checks++ }
    
    return checks > 0 ? score : 0
  }

  private checkGrowthConsistency(growthData: any[]): number {
    if (growthData.length < 2) return 0.5
    
    let consistentGrowth = 0
    for (let i = 1; i < growthData.length; i++) {
      const prev = growthData[i-1]
      const curr = growthData[i]
      
      if (curr.height >= prev.height && curr.diameter >= prev.diameter) {
        consistentGrowth++
      }
    }
    
    return consistentGrowth / (growthData.length - 1)
  }

  private checkEnvironmentalHealth(environmentalData: any[]): number {
    if (environmentalData.length === 0) return 0.5
    
    const waterQuality = this.getWaterQuality(environmentalData)
    const soilQuality = this.getSoilQuality(environmentalData)
    const airQuality = this.getAirQuality(environmentalData)
    
    return (waterQuality + soilQuality + airQuality) / 3
  }

  private checkSatelliteConsistency(satelliteData: any[]): number {
    if (satelliteData.length < 2) return 0.5
    
    const vegetationTrend = this.getAreaChange(satelliteData)
    return vegetationTrend >= 0 ? Math.min(1, 0.5 + vegetationTrend) : Math.max(0, 0.5 + vegetationTrend)
  }

  private validateCarbonCalculation(prediction: AIModelPrediction): number {
    // Validate carbon calculation against known benchmarks
    const expectedRange = { min: 1, max: 10 } // tCO2/hectare/year
    
    if (prediction.carbonSequestration >= expectedRange.min && 
        prediction.carbonSequestration <= expectedRange.max) {
      return 1.0
    }
    
    const deviation = Math.min(
      Math.abs(prediction.carbonSequestration - expectedRange.min),
      Math.abs(prediction.carbonSequestration - expectedRange.max)
    )
    
    return Math.max(0, 1 - deviation / expectedRange.max)
  }

  private async checkNCCRCompliance(projectData: ProjectData): Promise<number> {
    // Check compliance with NCCR standards
    try {
      const response = await axios.post(`${process.env.NCCR_API_ENDPOINT}/compliance/check`, {
        projectId: projectData.id,
        ecosystem: projectData.ecosystem,
        area: projectData.area,
        methodology: 'blue-carbon-v1'
      })
      
      return response.data.complianceScore || 0.5
    } catch (error) {
      console.error('❌ NCCR compliance check failed:', error)
      return 0.5
    }
  }

  private identifyRiskFactors(projectData: ProjectData, prediction: AIModelPrediction): string[] {
    const risks: string[] = []
    
    if (prediction.confidence < 0.7) {
      risks.push('Low prediction confidence - insufficient data quality')
    }
    
    if (this.getDeforestationRisk(projectData.satelliteData) > 0.3) {
      risks.push('High deforestation risk detected from satellite imagery')
    }
    
    if (this.calculateSurvivalRate(projectData) < 0.8) {
      risks.push('Low survival rate of planted species')
    }
    
    if (this.getWaterQuality(projectData.environmentalData) < 0.6) {
      risks.push('Poor water quality affecting ecosystem health')
    }
    
    if (prediction.carbonSequestration < 2) {
      risks.push('Below-average carbon sequestration rate')
    }
    
    return risks
  }

  private generateRecommendations(
    projectData: ProjectData, 
    prediction: AIModelPrediction, 
    checks: any
  ): string[] {
    const recommendations: string[] = []
    
    if (checks.dataQuality < 0.7) {
      recommendations.push('Increase data collection frequency and quality')
    }
    
    if (prediction.healthScore < 0.6) {
      recommendations.push('Implement ecosystem health improvement measures')
    }
    
    if (this.calculateSpeciesDiversity(projectData) < 3) {
      recommendations.push('Increase species diversity for better resilience')
    }
    
    if (this.getWaterQuality(projectData.environmentalData) < 0.6) {
      recommendations.push('Improve water quality management')
    }
    
    if (prediction.carbonSequestration < 3) {
      recommendations.push('Optimize planting density and species selection')
    }
    
    return recommendations
  }

  // Utility methods
  private async fetchProjectData(projectId: string): Promise<ProjectData> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        dataEntries: true
      }
    })

    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    return {
      id: project.id,
      ecosystem: project.ecosystem || 'mangrove',
      area: project.area,
      location: {
        latitude: parseFloat(project.location.split(',')[0]),
        longitude: parseFloat(project.location.split(',')[1])
      },
      plantingData: project.dataEntries.filter(d => d.dataType === 'planting'),
      growthData: project.dataEntries.filter(d => d.dataType === 'growth'),
      environmentalData: project.dataEntries.filter(d => d.dataType.includes('quality')),
      satelliteData: project.dataEntries.filter(d => d.source === 'satellite')
    }
  }

  private async storeVerificationResult(projectId: string, result: VerificationResult) {
    await prisma.verification.create({
      data: {
        projectId,
        isVerified: result.isVerified,
        confidence: result.confidence,
        carbonSequestration: result.carbonSequestration,
        biomassEstimate: result.biomassEstimate,
        growthRate: result.growthRate,
        environmentalHealth: result.environmentalHealth,
        riskFactors: JSON.stringify(result.riskFactors),
        recommendations: JSON.stringify(result.recommendations),
        complianceScore: result.complianceScore,
        verificationDate: new Date(),
        verifierType: 'ai_system'
      }
    })
  }

  private getDefaultVerificationResult(): VerificationResult {
    return {
      isVerified: false,
      confidence: 0,
      carbonSequestration: 0,
      biomassEstimate: 0,
      growthRate: 0,
      environmentalHealth: 0,
      riskFactors: ['Verification system error'],
      recommendations: ['Contact system administrator'],
      complianceScore: 0
    }
  }

  private getDefaultPrediction(): AIModelPrediction {
    return {
      carbonSequestration: 0,
      biomass: 0,
      growthRate: 0,
      healthScore: 0,
      confidence: 0
    }
  }
}

// Singleton instance
export const aiProjectVerification = new AIProjectVerification()

export default AIProjectVerification
