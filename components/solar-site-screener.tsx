"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calculator, Check, MapPin, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Energy usage estimates per square foot per year
const ENERGY_USAGE_ESTIMATES = {
  Office: 15,
  "Warehouse (non-refrigerated)": 6,
  "Cold Storage Facility": 40,
  "Grocery Store / Supermarket": 50,
  Restaurant: 35,
  "Retail Store": 18,
  "Agriculture Processing Facility": 25,
  "Manufacturing / Industrial": 22,
  "School / Educational Facility": 10,
  "Gym / Fitness Center": 30,
}

type BusinessType = keyof typeof ENERGY_USAGE_ESTIMATES

interface ScanResults {
  roofSize: number
  monthlyUsage: number
  systemSize: number
  annualSavings: number
  buildCost: number
  roi: number
}

export default function SolarSiteScreener() {
  const [address, setAddress] = useState("")
  const [businessType, setBusinessType] = useState<BusinessType | "">("")
  const [isEstimating, setIsEstimating] = useState(false)
  const [squareFootage, setSquareFootage] = useState<number | null>(null)
  const [estimatedUsage, setEstimatedUsage] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ScanResults | null>(null)

const estimateBuildingSize = async (address: string, businessType: BusinessType) => {
  setIsEstimating(true)

  try {
    const response = await fetch("http://165.232.159.15:3000/solar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })

    const data = await response.json()
    const estimatedSize = Math.round(data.solar.roofAreaMeters2 * 10.76) // convert m² to ft²

    setSquareFootage(estimatedSize)

    const annualUsage = ENERGY_USAGE_ESTIMATES[businessType] * estimatedSize
    const monthlyUsage = Math.round(annualUsage / 12)
    setEstimatedUsage(monthlyUsage)

    return estimatedSize
  } catch (error) {
    console.error("Error estimating building size:", error)
    return 0
  } finally {
    setIsEstimating(false)
  }
}

  // Trigger estimation when both address and business type are provided
  useEffect(() => {
    if (address && businessType) {
      estimateBuildingSize(address, businessType)
    }
  }, [address, businessType])

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch("http://165.232.159.15:3000/solar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    const roofSize = data.solar.roofAreaMeters2 * 10.76; // convert to ft²
    const systemSize = data.solar.estimatedKw;
    const monthlyUsage = estimatedUsage || 0;

    // Basic assumptions (you can refine later)
    const annualSavings = Math.round(monthlyUsage * 12 * 0.35); // Assume $0.35/kWh offset
    const buildCost = Math.round(systemSize * 2150); // Assume $2.15/watt installed
    const roi = Math.round((annualSavings / buildCost) * 100);

    setResults({
      roofSize: Math.round(roofSize),
      monthlyUsage,
      systemSize,
      annualSavings,
      buildCost,
      roi,
    });
  } catch (err) {
    console.error("API call failed:", err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-yellow-500" />
          <CardTitle className="text-2xl">Solar Site Screener</CardTitle>
        </div>
        <CardDescription>Enter property details to check solar feasibility</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>
            <Select value={businessType} onValueChange={(value) => setBusinessType(value as BusinessType)}>
              <SelectTrigger id="businessType">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ENERGY_USAGE_ESTIMATES).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEstimating && (
            <div className="py-4 text-center">
              <div className="inline-block animate-pulse bg-green-100 text-green-800 px-4 py-2 rounded-md">
                Estimating building size from Google Maps...
              </div>
            </div>
          )}

          {squareFootage !== null && estimatedUsage !== null && !isEstimating && (
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Estimated Building Size</p>
                    <p className="text-xl font-semibold">{squareFootage.toLocaleString()} ft²</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Estimated Monthly Usage</p>
                    <p className="text-xl font-semibold">{estimatedUsage.toLocaleString()} kWh</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="utility">Utility Provider</Label>
            <Select defaultValue="PG&E">
              <SelectTrigger id="utility">
                <SelectValue placeholder="Select utility provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PG&E">PG&E</SelectItem>
                <SelectItem value="SCE">SCE</SelectItem>
                <SelectItem value="SDGE">SDG&E</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tariff">Tariff Plan</Label>
            <Select defaultValue="A-1">
              <SelectTrigger id="tariff">
                <SelectValue placeholder="Select tariff plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-1">A-1</SelectItem>
                <SelectItem value="B-1">B-1</SelectItem>
                <SelectItem value="B-10">B-10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading || isEstimating || !estimatedUsage}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
                Processing...
              </span>
            ) : (
              "Run Feasibility Scan"
            )}
          </Button>
        </form>

        {results && (
          <div className="mt-6">
            <Card className="border-2 border-blue-200 shadow-md overflow-hidden">
              <CardHeader className="bg-blue-50 py-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg text-blue-800">Solar Feasibility Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Estimated Roof Size</p>
                        <p className="text-xl font-semibold">{results.roofSize.toLocaleString()} ft²</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Estimated Monthly Usage</p>
                        <p className="text-xl font-semibold">{results.monthlyUsage.toLocaleString()} kWh</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">System Size Needed</p>
                        <p className="text-xl font-semibold">{results.systemSize} kW</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Estimated Annual Savings</p>
                        <p className="text-xl font-semibold text-blue-600">${results.annualSavings.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Estimated Build Cost</p>
                        <p className="text-xl font-semibold">${results.buildCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Estimated ROI</p>
                        <p className="text-xl font-semibold text-blue-600">{results.roi}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
