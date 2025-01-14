"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneCall, Users, Clock, BarChart } from 'lucide-react'
import Link from "next/link"
import { useCallStore } from "@/lib/store"
import { formatDuration, cn } from "@/lib/utils"

export default function Home() {
  const { calls } = useCallStore()
  const callsArray = Object.values(calls)
  const activeCalls = callsArray.filter(call => call.status === 'active')
  const completedCalls = callsArray.filter(call => call.status === 'completed')

  const calculateAverageDuration = () => {
    if (completedCalls.length === 0) return 0
    const totalDuration = completedCalls.reduce((acc, call) => {
      return acc + ((call.endTime || 0) - call.startTime)
    }, 0)
    return Math.floor(totalDuration / completedCalls.length / 1000)
  }

  const successRate = completedCalls.length > 0
    ? Math.round((completedCalls.length / callsArray.length) * 100)
    : 0

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">AI Call Center</h1>
          <p className="text-muted-foreground">Manage and monitor your AI-powered calls</p>
        </div>
        <Link href="/call">
          <Button>
            <PhoneCall className="mr-2 h-4 w-4" />
            Start New Call
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCalls.length}</div>
            <p className="text-xs text-muted-foreground">Real-time active calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callsArray.length}</div>
            <p className="text-xs text-muted-foreground">All-time calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(calculateAverageDuration())}</div>
            <p className="text-xs text-muted-foreground">For completed calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Completed calls</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Your latest AI-powered conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {callsArray.slice(-3).map((call) => (
                <div key={call.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      call.status === 'active' ? "bg-green-500" :
                      call.status === 'completed' ? "bg-blue-500" : "bg-red-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium">Call #{call.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(Math.floor((
                          (call.endTime || Date.now()) - call.startTime
                        ) / 1000))} • {call.status}
                      </p>
                    </div>
                  </div>
                  <Link href={`/transcript/${call.id}`}>
                    <Button variant="ghost" size="sm">
                      View Transcript
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Real-time call center analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Active Rate</p>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-primary" 
                      style={{
                        width: `${(activeCalls.length / Math.max(callsArray.length, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round((activeCalls.length / Math.max(callsArray.length, 1)) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Completion Rate</p>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(completedCalls.length / Math.max(callsArray.length, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round((completedCalls.length / Math.max(callsArray.length, 1)) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

