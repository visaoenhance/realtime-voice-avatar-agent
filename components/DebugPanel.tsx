'use client'

import React, { useState, useCallback } from 'react'

interface AgentLog {
  type: 'user_said' | 'agent_saying' | 'tool_called' | 'tool_result' | 'info' | 'error'
  message: string
  timestamp: number
  details?: any
}

interface DebugPanelProps {
  toolExecutions?: Array<{
    toolName: string
    payload: any
    timestamp: number
    executionTime?: number
  }>
  agentLogs?: AgentLog[]
  isProduction?: boolean
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  toolExecutions = [], 
  agentLogs = [],
  isProduction = false 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'logs' | 'tools'>('logs')

  // Hide debug panel in production by default
  if (isProduction && !isVisible) {
    return null
  }

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+D or Cmd+D to toggle
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault()
        toggleVisibility()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleVisibility])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleVisibility}
          className="bg-gray-800 text-white px-3 py-1.5 rounded-md text-xs font-mono hover:bg-gray-700 transition-colors shadow-lg"
          title="Open Debug Panel (Ctrl+D)"
        >
          Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-2xl w-[700px] max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">Debug Panel</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live"></div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-300">
            {agentLogs.length} logs • {toolExecutions.length} tools
          </span>
          <button
            onClick={toggleVisibility}
            className="text-gray-300 hover:text-white text-lg leading-none"
            title="Close (Ctrl+D)"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🎙️ Agent Logs ({agentLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'tools'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔧 Tool Executions ({toolExecutions.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'logs' ? (
          // Agent Logs Tab
          agentLogs.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No agent logs yet. Start a conversation to see the stream.
            </div>
          ) : (
            <div className="p-2 space-y-1 font-mono text-xs">
              {agentLogs.slice(-50).map((log, index) => {
                const logColors = {
                  user_said: 'text-blue-600',
                  agent_saying: 'text-green-600',
                  tool_called: 'text-purple-600',
                  tool_result: 'text-orange-600',
                  info: 'text-gray-600',
                  error: 'text-red-600'
                }
                const logIcons = {
                  user_said: '🎤',
                  agent_saying: '🤖',
                  tool_called: '🔧',
                  tool_result: '✅',
                  info: 'ℹ️',
                  error: '❌'
                }
                
                return (
                  <div key={`${log.timestamp}-${index}`} className="flex gap-2 items-start hover:bg-gray-50 p-1 rounded">
                    <span className="text-gray-400 w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex-shrink-0">{logIcons[log.type]}</span>
                    <span className={`flex-1 ${logColors[log.type]}`}>
                      {log.message}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          // Tool Executions Tab (existing)
          toolExecutions.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No tool executions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {toolExecutions.slice(-10).reverse().map((execution, index) => (
                <div 
                  key={execution.timestamp} 
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedExecution === index ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedExecution(selectedExecution === index ? null : index)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono text-blue-600">
                      {execution.toolName}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {execution.executionTime && (
                        <span>{execution.executionTime}ms</span>
                      )}
                      <span>
                        {new Date(execution.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  {selectedExecution === index && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                      <pre className="whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                        {JSON.stringify(execution.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Press Ctrl+D to toggle</span>
          <button
            onClick={() => setSelectedExecution(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            Collapse all
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugPanel