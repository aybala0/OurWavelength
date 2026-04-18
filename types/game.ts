export type GameStatus = 'lobby' | 'clue-giving' | 'guessing' | 'summary'

export interface Player {
  email: string
  name: string
  avatar: string // avatarId e.g. 'cat'
}

export interface Assignment {
  playerEmail: string
  playerName: string
  spectrumId: string
  targetPosition: number // 0–100
  clue: string | null
  submitted: boolean
  // guessing phase
  dialPosition: number // 0–100, starts at 50
  readyPlayers: string[] // emails of players who pressed ready
  revealed: boolean
  score: number | null
}

export interface Game {
  code: string
  hostEmail: string
  status: GameStatus
  players: Player[]
  spectrumCount: number
  assignments: Assignment[]
  currentGuessIndex: number
  totalScore: number
  maxPossibleScore: number
  timerEnd: number | null // unix ms timestamp
  createdAt: number
}
