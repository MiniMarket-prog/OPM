"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { columns, type ReturnedServerRow } from "./columns" // Import ReturnedServerRow
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Assuming you have Tabs components

interface AdminReturnsClientPageProps {
  initialReturnedServers: ReturnedServerRow[] // Use the new type
  initialPendingServers: ReturnedServerRow[] // Use the new type
}

export default function AdminReturnsClientPage({
  initialReturnedServers,
  initialPendingServers,
}: AdminReturnsClientPageProps) {
  const [returnedServers, setReturnedServers] = useState(initialReturnedServers)
  const [pendingServers, setPendingServers] = useState(initialPendingServers)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Server Returns Management</h2>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Return Approvals ({pendingServers.length})</TabsTrigger>
          <TabsTrigger value="returned">Returned Servers History ({returnedServers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Return Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingServers.length > 0 ? (
                <DataTable columns={columns} data={pendingServers} filterColumnId="ip_address" />
              ) : (
                <p className="text-center text-muted-foreground">No pending server return requests.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Returned Servers History</CardTitle>
            </CardHeader>
            <CardContent>
              {returnedServers.length > 0 ? (
                <DataTable columns={columns} data={returnedServers} filterColumnId="ip_address" />
              ) : (
                <p className="text-center text-muted-foreground">No servers have been returned yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
