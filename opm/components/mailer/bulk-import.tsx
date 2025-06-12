"use client"

import type React from "react"
import { useState, useRef, useTransition, useCallback, useMemo } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  addBulkSeedEmails,
  addBulkServers,
  addBulkProxies,
  addBulkRdps,
} from "@/app/(dashboard)/mailer/resources/actions"
import { toast } from "sonner"
import { Upload, FileText, CheckCircle, XCircle, Loader2, Info, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type ResourceType = "seed-emails" | "servers" | "proxies" | "rdps"

const IS_IPV4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
const isValidIp = (ip: string) => IS_IPV4_REGEX.test(ip.trim())
const isValidDate = (dateString: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime())

interface ParsedRowBase {
  originalLine: string
  lineNumber: number
  error?: string
}

interface ParsedSeedEmailRow extends ParsedRowBase {
  type: "seed-emails"
  email?: string
  passwordAlias?: string
  recoveryEmail?: string
  isDuplicateInBatch?: boolean
  duplicateOfLine?: number
}

interface ParsedServerRow extends ParsedRowBase {
  type: "servers"
  serverName?: string
  ip?: string
  isHeader?: boolean
}

interface ParsedProxyRow extends ParsedRowBase {
  type: "proxies"
  ip?: string
  port?: string
  username?: string
  password?: string
}

interface ParsedRdpRow extends ParsedRowBase {
  type: "rdps"
  ipAddress?: string
  username?: string
  passwordAlias?: string
  entryDate?: string
}

type ParsedRow = ParsedSeedEmailRow | ParsedServerRow | ParsedProxyRow | ParsedRdpRow
type ParserResult<T extends ParsedRow> = Omit<T, "originalLine" | "lineNumber" | "type">

const resourceConfig: {
  [K in ResourceType]: {
    name: string
    columns: string[]
    template: string
    action: (...args: any[]) => Promise<any>
    minColumns?: number
    parser: (line: string, index: number, allLines: string[]) => ParserResult<Extract<ParsedRow, { type: K }>>
  }
} = {
  "seed-emails": {
    name: "Seed Emails",
    columns: ["Email", "Password Alias", "Recovery Email"],
    template:
      "email@example.com,your_password_alias,recovery@example.com\nuser2@example.com\talias2\nuser3@domain.com  P@$$wOrd  recover@other.com",
    action: addBulkSeedEmails,
    minColumns: 2,
    parser: (line: string): ParserResult<ParsedSeedEmailRow> => {
      const parts = line
        .split(/[\t,]|\s+/)
        .map((p) => p.trim())
        .filter((p) => p !== "")

      const [email, passwordAlias, recoveryEmail] = parts

      if (!email || !passwordAlias) {
        return {
          error: "Requires Email and Password Alias. Format: email DELIMITER password_alias [DELIMITER recovery_email]",
        }
      }
      if (parts.length > 3) {
        return {
          error: "Too many parts. Expected 2 or 3 fields separated by comma, tab, or spaces.",
        }
      }
      return { email, passwordAlias, recoveryEmail: recoveryEmail || undefined }
    },
  },
  servers: {
    name: "Servers",
    columns: ["Server Name / IP Address", "Details"],
    template: "server-name1\n1.2.3.4\n1.2.3.5\nserver-name2\n2.3.4.5\n",
    action: addBulkServers,
    parser: (line: string): ParserResult<ParsedServerRow> => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return { error: "Empty line" }
      if (isValidIp(trimmedLine)) {
        return { ip: trimmedLine }
      } else {
        if (trimmedLine.includes(",")) return { error: "Server name should not contain commas." }
        return { serverName: trimmedLine, isHeader: true }
      }
    },
  },
  proxies: {
    name: "Proxies",
    columns: ["IP", "Port", "Username", "Password"],
    template: "1.2.3.4,8080,user,pass\n1.2.3.5\t8081\tuser2\tpass2\n1.2.3.6  8082  user3  pass3",
    action: addBulkProxies,
    minColumns: 4,
    parser: (line: string): ParserResult<ParsedProxyRow> => {
      const parts = line
        .split(/[\t,]|\s+/)
        .map((p) => p.trim())
        .filter((p) => p !== "")
      const [ip, port, username, password] = parts

      if (parts.length < 4 || !ip || !port || !username || !password) {
        return {
          error: "Requires IP, Port, Username, Password. Format: ip DELIMITER port DELIMITER user DELIMITER pass",
        }
      }
      if (parts.length > 4) {
        return { error: "Too many parts. Expected 4 fields separated by comma, tab, or spaces." }
      }
      if (!isValidIp(ip)) return { ip, port, username, password, error: "Invalid IP address format." }
      if (!/^\d+$/.test(port)) return { ip, port, username, password, error: "Port must be a number." }
      return { ip, port, username, password }
    },
  },
  rdps: {
    name: "RDPs",
    columns: ["IP Address", "Username", "Password Alias", "Entry Date"],
    template: "192.168.1.1,user1,pass1,2023-01-01\n10.0.0.1,user2,pass2,2023-01-02",
    action: addBulkRdps,
    minColumns: 4,
    parser: (line: string): ParserResult<ParsedRdpRow> => {
      const parts = line
        .split(/[\t,]|\s+/)
        .map((p) => p.trim())
        .filter((p) => p !== "")
      const [ipAddress, username, passwordAlias, entryDate] = parts

      if (parts.length < 4 || !ipAddress || !username || !passwordAlias || !entryDate) {
        return {
          error:
            "Requires IP Address, Username, Password Alias, and Entry Date. Format: ip DELIMITER user DELIMITER pass DELIMITER date",
        }
      }
      if (parts.length > 4) {
        return { error: "Too many parts. Expected 4 fields separated by comma, tab, or spaces." }
      }
      if (!isValidIp(ipAddress))
        return { ipAddress, username, passwordAlias, entryDate, error: "Invalid IP address format." }
      if (!isValidDate(entryDate))
        return {
          ipAddress,
          username,
          passwordAlias,
          entryDate,
          error: "Invalid Entry Date format. Expected YYYY-MM-DD.",
        }
      return { ipAddress, username, passwordAlias, entryDate }
    },
  },
}

type ServerActionResult = {
  success?: string
  error?: string
  partialErrors?: string[]
  data?: any
  skippedEmails?: Array<{ email: string; reason: string; existing_group_name?: string | null }>
}

export function BulkImport({
  currentUser,
  existingGroupNames,
}: {
  currentUser: User
  existingGroupNames: string[]
}) {
  const [activeTab, setActiveTab] = useState<ResourceType>("seed-emails")
  const [textInput, setTextInput] = useState("")
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [groupingOption, setGroupingOption] = useState<"none" | "existing" | "new">("none")
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [newGroupName, setNewGroupName] = useState<string>("")
  const [lastImportSummary, setLastImportSummary] = useState<ServerActionResult | null>(null)

  const config = resourceConfig[activeTab]

  const parseAndValidate = useCallback((input: string, currentTab: ResourceType) => {
    setLastImportSummary(null) // Clear previous summary on new input
    const lines = input.split("\n").filter((line) => line.trim() !== "")
    const tabConfig = resourceConfig[currentTab]

    let validatedRows: ParsedRow[] = lines.map((line, index) => {
      const common = { originalLine: line, lineNumber: index + 1, type: currentTab }
      const parsed = tabConfig.parser(line, index, lines)
      return { ...common, ...parsed } as ParsedRow
    })

    if (currentTab === "seed-emails") {
      const emailMap = new Map<string, number>()
      validatedRows = validatedRows.map((row) => {
        if (row.type === "seed-emails") {
          const seedRow = row as ParsedSeedEmailRow
          if (seedRow.email && !seedRow.error) {
            const emailKey = seedRow.email.toLowerCase()
            if (emailMap.has(emailKey)) {
              const firstSeenLine = emailMap.get(emailKey)!
              return {
                ...seedRow,
                isDuplicateInBatch: true,
                duplicateOfLine: firstSeenLine,
                error: seedRow.error
                  ? `${seedRow.error}; Duplicate in current input (line ${firstSeenLine})`
                  : `Duplicate in current input (first seen on line ${firstSeenLine})`,
              } as ParsedSeedEmailRow
            } else {
              emailMap.set(emailKey, seedRow.lineNumber)
            }
          }
        }
        return row
      })
    }
    setParsedData(validatedRows)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setTextInput(content)
        parseAndValidate(content, activeTab)
      }
      reader.readAsText(file)
    }
    if (event.target) event.target.value = ""
  }

  const { validRowsForSubmission, batchDuplicateCount } = useMemo(() => {
    const batchDuplicates = parsedData.filter(
      (row): row is ParsedSeedEmailRow => row.type === "seed-emails" && !!row.isDuplicateInBatch,
    )
    const valids = parsedData.filter((row) => {
      if (row.type === "seed-emails") {
        return !row.error && !row.isDuplicateInBatch
      }
      return !row.error
    })
    return {
      validRowsForSubmission: valids,
      batchDuplicateCount: batchDuplicates.length,
    }
  }, [parsedData])

  const handleSubmit = async () => {
    if (validRowsForSubmission.length === 0) {
      toast.error("No valid, non-duplicate data (from current input) to submit.")
      return
    }
    setLastImportSummary(null)

    startTransition(async () => {
      let result: ServerActionResult | undefined

      try {
        if (activeTab === "seed-emails") {
          let groupNameToSubmit: string | undefined | null = null
          if (groupingOption === "new" && newGroupName.trim()) {
            groupNameToSubmit = newGroupName.trim()
          } else if (groupingOption === "existing" && selectedGroup) {
            groupNameToSubmit = selectedGroup
          }

          const seedEmailsToSubmit = (validRowsForSubmission as ParsedSeedEmailRow[]).map((row) => ({
            email: row.email!,
            password_alias: row.passwordAlias!,
            recovery_email: row.recoveryEmail,
          }))
          result = await addBulkSeedEmails(seedEmailsToSubmit, currentUser.id, currentUser.team_id!, groupNameToSubmit)

          if (batchDuplicateCount > 0) {
            toast.info(`${batchDuplicateCount} duplicate email(s) within your input were automatically skipped.`)
          }
        } else if (activeTab === "servers") {
          const serverEntries: { serverName: string; ips: string[] }[] = []
          let currentServerName: string | null = null
          let currentIps: string[] = []
          for (const row of validRowsForSubmission as ParsedServerRow[]) {
            if (row.isHeader && row.serverName) {
              if (currentServerName && currentIps.length > 0) {
                serverEntries.push({ serverName: currentServerName, ips: [...currentIps] })
              }
              currentServerName = row.serverName
              currentIps = []
            } else if (row.ip && currentServerName) {
              currentIps.push(row.ip)
            } else if (row.ip && !currentServerName) {
              toast.warning(`IP ${row.ip} found without a server name. It will be skipped.`)
            }
          }
          if (currentServerName && currentIps.length > 0) {
            serverEntries.push({ serverName: currentServerName, ips: [...currentIps] })
          }
          if (serverEntries.length > 0) {
            result = await addBulkServers(serverEntries, currentUser.id, currentUser.team_id!)
          } else {
            toast.error("No valid server and IP groups found to submit.")
            return
          }
        } else if (activeTab === "proxies") {
          const proxiesData = (validRowsForSubmission as ParsedProxyRow[])
            .map((row) => `${row.ip}:${row.port}:${row.username}:${row.password}`)
            .join("\n")
          if (proxiesData) {
            result = await addBulkProxies(proxiesData, currentUser.id, currentUser.team_id!)
          } else {
            toast.error("No valid proxy data to submit.")
            return
          }
        } else if (activeTab === "rdps") {
          const rdpsToSubmit = (validRowsForSubmission as ParsedRdpRow[]).map((row) => ({
            ip_address: row.ipAddress!,
            username: row.username!,
            password_alias: row.passwordAlias!,
            entry_date: row.entryDate!,
          }))
          if (rdpsToSubmit.length > 0) {
            result = await addBulkRdps(rdpsToSubmit, currentUser.id, currentUser.team_id!)
          } else {
            toast.error("No valid RDP data to submit.")
            return
          }
        }

        setLastImportSummary(result || null)

        if (result?.success) {
          toast.success(result.success)
        } else if (result?.error && !result.success) {
          toast.error("Import Error", { description: result.error })
        }

        if (result?.partialErrors?.length) {
          result.partialErrors.forEach((err) => toast.warning("Partial Error During Import", { description: err }))
        }

        if (activeTab === "seed-emails" && result?.skippedEmails?.length) {
          toast.warning(`${result.skippedEmails.length} email(s) were skipped as they already exist in the database.`, {
            description: "Check the summary below the import form for details.",
            duration: 8000,
          })
        }

        if (result?.success || (result?.skippedEmails && result.skippedEmails.length > 0)) {
          setTextInput("")
          setParsedData([])
        }
      } catch (e: any) {
        toast.error("An unexpected error occurred", { description: e.message })
        setLastImportSummary({ error: "An unexpected error occurred: " + e.message })
      }
    })
  }

  const renderRow = (row: ParsedRow, index: number) => {
    let cells: React.ReactNode[] = []
    let errorDisplay: React.ReactNode = null

    const isSeedEmailDuplicateInBatch = row.type === "seed-emails" && (row as ParsedSeedEmailRow).isDuplicateInBatch

    if (row.error || isSeedEmailDuplicateInBatch) {
      let errorMessage = row.error || ""
      if (isSeedEmailDuplicateInBatch && !errorMessage.includes("Duplicate in current input")) {
        const seedEmailRow = row as ParsedSeedEmailRow
        const duplicateMessage = `Duplicate in current input (line ${seedEmailRow.duplicateOfLine}).`
        errorMessage = errorMessage ? `${duplicateMessage} ${errorMessage}` : duplicateMessage
      }
      errorDisplay = (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-red-600 text-xs flex items-center">
                <XCircle className="h-3 w-3 mr-1 flex-shrink-0" /> Error
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{errorMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    } else {
      errorDisplay = (
        <span className="text-green-600 text-xs flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" /> Valid
        </span>
      )
    }

    if (row.type === "seed-emails") {
      const r = row as ParsedSeedEmailRow
      cells = [r.email, r.passwordAlias, r.recoveryEmail || "-"].map((text, i) => (
        <TableCell key={i} className="text-xs py-1 px-2">
          {text}
        </TableCell>
      ))
    } else if (row.type === "servers") {
      const r = row as ParsedServerRow
      if (r.isHeader) {
        cells = [
          <TableCell key="name" className="text-xs font-semibold py-1 px-2">
            {" "}
            {r.serverName}{" "}
          </TableCell>,
          <TableCell key="detail" className="text-xs text-muted-foreground py-1 px-2">
            {" "}
            Server Name{" "}
          </TableCell>,
        ]
      } else {
        cells = [
          <TableCell key="ip" className="text-xs pl-6 py-1 px-2">
            {" "}
            {r.ip}{" "}
          </TableCell>,
          <TableCell key="detail" className="text-xs text-muted-foreground py-1 px-2">
            {" "}
            IP Address{" "}
          </TableCell>,
        ]
      }
    } else if (row.type === "proxies") {
      const r = row as ParsedProxyRow
      cells = [r.ip, r.port, r.username, r.password].map((text, i) => (
        <TableCell key={i} className="text-xs py-1 px-2">
          {text}
        </TableCell>
      ))
    } else if (row.type === "rdps") {
      const r = row as ParsedRdpRow
      cells = [r.ipAddress, r.username, r.passwordAlias, r.entryDate].map((text, i) => (
        <TableCell key={i} className="text-xs py-1 px-2">
          {text}
        </TableCell>
      ))
    }

    return (
      <TableRow
        key={`${row.type}-${index}-${row.originalLine}`}
        className={row.error || isSeedEmailDuplicateInBatch ? "bg-red-50 dark:bg-red-900/30" : ""}
      >
        {cells}
        <TableCell className="text-xs py-1 px-2">{errorDisplay}</TableCell>
      </TableRow>
    )
  }

  const parsingErrorsCount = useMemo(() => {
    return parsedData.filter((row) => {
      if (row.type === "seed-emails") {
        const seedRow = row as ParsedSeedEmailRow
        return seedRow.error && !seedRow.isDuplicateInBatch
      }
      return !!row.error
    }).length
  }, [parsedData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Bulk Data Import</CardTitle>
        <CardDescription>
          Upload a CSV/text file or paste data from a spreadsheet to add resources in bulk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value: string) => {
            setActiveTab(value as ResourceType)
            setTextInput("")
            setParsedData([])
            setLastImportSummary(null)
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="seed-emails">Seed Emails</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="proxies">Proxies</TabsTrigger>
            <TabsTrigger value="rdps">RDPs</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            <div>
              <h3 className="font-semibold mb-2">1. Provide Data</h3>
              <div className="flex items-center gap-2 mb-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(config.template)}`}
                  download={`${activeTab}-template.${activeTab === "servers" ? "txt" : "csv"}`}
                >
                  <Button variant="link" className="p-0 h-auto">
                    <FileText className="mr-1 h-4 w-4" /> Download Template
                  </Button>
                </a>
              </div>
              <Textarea
                placeholder={`Paste data here. One entry per line.\n\nFormat for ${config.name}:\n${config.template.split("\n").slice(0, 3).join("\n")}${config.template.split("\n").length > 3 ? "..." : ""}`}
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value)
                  parseAndValidate(e.target.value, activeTab)
                }}
                rows={10}
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                <Info className="h-3 w-3 inline mr-1" />
                For {config.name}:{" "}
                {activeTab === "servers"
                  ? "Enter server name on its own line, followed by its IP addresses on subsequent lines."
                  : activeTab === "seed-emails"
                    ? "Use comma, tab, or space(s) separated values. Expected columns: Email, Password Alias, Recovery Email (optional)."
                    : activeTab === "proxies"
                      ? "Use comma, tab, or space(s) separated values. Expected columns: IP, Port, Username, Password."
                      : "Use comma, tab, or space(s) separated values. Expected columns: IP Address, Username, Password Alias, Entry Date (YYYY-MM-DD)."}
              </p>

              {activeTab === "seed-emails" && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">2. Assign Group (Optional)</h3>
                  <RadioGroup
                    value={groupingOption}
                    onValueChange={(v) => setGroupingOption(v as "none" | "existing" | "new")}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="g-none" />
                      <Label htmlFor="g-none" className="font-normal">
                        Do not assign to a group
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="g-existing" />
                      <Label htmlFor="g-existing" className="font-normal">
                        Add to existing group
                      </Label>
                    </div>
                    {groupingOption === "existing" && (
                      <Select onValueChange={setSelectedGroup} value={selectedGroup}>
                        <SelectTrigger className="ml-6 w-[calc(100%-1.5rem)]">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingGroupNames.length > 0 ? (
                            existingGroupNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">No existing groups found.</div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="g-new" />
                      <Label htmlFor="g-new" className="font-normal">
                        Create and add to new group
                      </Label>
                    </div>
                    {groupingOption === "new" && (
                      <Input
                        placeholder="Enter new group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="ml-6 w-[calc(100%-1.5rem)]"
                      />
                    )}
                  </RadioGroup>
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">
                {activeTab === "seed-emails" ? "3. Preview & Submit" : "2. Preview & Submit"}
              </h3>
              <div className="border rounded-lg bg-muted/30 min-h-[260px] flex flex-col">
                {parsedData.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground flex-grow flex items-center justify-center">
                    Preview will appear here.
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 border-b gap-2 flex-wrap">
                      <div
                        className={`flex items-center gap-1 ${validRowsForSubmission.length > 0 ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> {validRowsForSubmission.length} Valid for
                        Submission
                      </div>
                      {activeTab === "seed-emails" && batchDuplicateCount > 0 && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {batchDuplicateCount} Duplicates in Input
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-1 ${parsingErrorsCount > 0 ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" /> {parsingErrorsCount} Input Format Errors
                      </div>
                    </div>
                    <div className="flex-grow overflow-y-auto text-xs">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {config.columns.map((col) => (
                              <TableHead key={col} className="py-1 px-2 h-auto text-xs">
                                {col}
                              </TableHead>
                            ))}
                            <TableHead className="py-1 px-2 h-auto text-xs">Validation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>{parsedData.slice(0, 50).map(renderRow)}</TableBody>
                      </Table>
                      {parsedData.length > 50 && (
                        <p className="text-center text-xs text-muted-foreground p-2">
                          ...and {parsedData.length - 50} more rows (only first 50 shown in preview).
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={isPending || validRowsForSubmission.length === 0} size="lg">
                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Submit{" "}
                {validRowsForSubmission.length > 0
                  ? `${validRowsForSubmission.length} Valid Entr${validRowsForSubmission.length === 1 ? "y" : "ies"}`
                  : "Entries"}
              </Button>
            </div>

            {lastImportSummary && (
              <Alert
                className="mt-6"
                variant={lastImportSummary.error && !lastImportSummary.success ? "destructive" : "default"}
              >
                <Info className="h-4 w-4" />
                <AlertTitle>
                  {lastImportSummary.success && "Import Processed"}
                  {lastImportSummary.error && !lastImportSummary.success && "Import Error"}
                  {!lastImportSummary.success && !lastImportSummary.error && "Import Summary"}
                </AlertTitle>
                <AlertDescription className="space-y-1">
                  {lastImportSummary.success && <p>{lastImportSummary.success}</p>}
                  {lastImportSummary.error && <p className="font-semibold">{lastImportSummary.error}</p>}

                  {lastImportSummary.skippedEmails && lastImportSummary.skippedEmails.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">
                        {lastImportSummary.skippedEmails.length} email(s) already existed in the database and were
                        skipped:
                      </p>
                      <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                        {lastImportSummary.skippedEmails.map((skipped) => (
                          <li key={skipped.email}>
                            {skipped.email}
                            {skipped.existing_group_name
                              ? ` (in group: ${skipped.existing_group_name})`
                              : " (no group)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastImportSummary.partialErrors && lastImportSummary.partialErrors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Additional errors during import:</p>
                      <ul className="list-disc list-inside text-xs">
                        {lastImportSummary.partialErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
