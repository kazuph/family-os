type VisibilitySource = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>
type Resume = { promise: Promise<void>; resolve: () => void }

function newResume(): Resume {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

/** Suspends RPC reconnection while the Workshop tab is not visible. */
export class ConnectionVisibility {
  readonly #source: VisibilitySource
  readonly #onHidden: () => void
  readonly #handleChange: () => void
  #resume?: Resume

  constructor(source: VisibilitySource, onHidden: () => void) {
    this.#source = source
    this.#onHidden = onHidden
    this.#handleChange = () => this.#update()
    if (source.visibilityState === 'hidden') this.#resume = newResume()
    source.addEventListener('visibilitychange', this.#handleChange)
  }

  get isHidden(): boolean {
    return this.#resume !== undefined
  }

  waitUntilVisible(): Promise<void> {
    return this.#resume?.promise ?? Promise.resolve()
  }

  dispose(): void {
    this.#source.removeEventListener('visibilitychange', this.#handleChange)
  }

  #update(): void {
    if (this.#source.visibilityState === 'hidden') {
      if (this.#resume) return
      this.#resume = newResume()
      this.#onHidden()
      return
    }

    const resume = this.#resume
    this.#resume = undefined
    resume?.resolve()
  }
}
