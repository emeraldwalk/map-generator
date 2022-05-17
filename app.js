/** @type HTMLCanvasElement */
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const colors = ['green', 'brown']

// [
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
//   [1, 1, 0,  0, 1, 0,  0, 0, 0],
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],

//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],

//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
//   [0, 0, 0,  0, 0, 0,  0, 0, 1],
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],

//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
//   [0, 0, 0,  0, 0, 0,  0, 0, 0],
// ]

class BlobMap {
  /**
   * @param width {number}
   * @param height {number}
   * @param tileSize {number}
   */
  constructor(width, height, tileSize) {
    this.width = width
    this.height = height
    this.tileSize = tileSize
    this.tileBitSize = tileSize / 3

    this.init()
  }

  init = () => {
    /** @type number[][] */
    this.data = []

    for (let r = 0; r < this.height; ++r) {
      for (let i = 0; i < 3; ++i) {
        const row = []

        for (let c = 0; c < this.width; ++c) {
          for (let j = 0; j < 3; ++j) {
            row.push(0)
          }
        }

        this.data.push(row)
      }
    }
  }

  isCellEmpty = ([x, y]) => {
    return !this.data[y * 3 + 1][x * 3 + 1]
  }

  /**
   * If corner already has at least 3 surrounding edges, fill
   * the corner and any remaining edges.
   * @param start {[number, number]}
   * @param end {[number, number]}
   */
  fillCorners = ([x1, y1], [x2, y2]) => {
    const corner = []
    const edges = []

    if (x1 < x2) {
      corner.push([1, -1], [1, -2], [2, -1], [2, -2])
      edges.push([0, -1], [3, -1], [1, -3])
    } else if (x1 > x2) {
      corner.push([-1, -1], [-1, -2], [-2, -1], [-2, -2])
      edges.push([0, -1], [-3, -1], [-1, -3])
    } else if (y1 < y2) {
      corner.push([-1, 1], [-2, 1], [-1, 2], [-2, 2])
      edges.push([-1, 0], [-1, 3], [-3, 1])
    } else if (y1 > y2) {
      corner.push([-1, -1], [-2, -1], [-1, -2], [-2, -2])
      edges.push([-1, 0], [-1, -3], [-3, -1])
    }

    if (
      edges.filter(([x, y]) => this.getBit(x1 * 3 + 1 + x, y1 * 3 + 1 + y))
        .length >= 2
    ) {
      console.log('---', [x1, y1], [x2, y2])
      console.log(corner)

      for (const [a, b] of [...corner, ...edges]) {
        this.setBit(x1 * 3 + 1 + a, y1 * 3 + 1 + b)
      }
    }
  }

  getBit = (x, y) => {
    return x >= 0 && x < this.width * 3 && y >= 0 && y < this.height * 3
      ? this.data[y][x]
      : 0
  }

  setBit = (x, y) => {
    if (x >= 0 && x < this.width * 3 && y >= 0 && y < this.height * 3) {
      this.data[y][x] = 1
    }
  }

  /**
   * @param start {[number, number]}
   * @param end {[number, number]}
   */
  setPath = (start, end) => {
    const [x1, y1] = start

    const xs = [x1 * 3 + 1]
    const ys = [y1 * 3 + 1]

    if (end) {
      const [x2, y2] = end

      if (x1 < x2) {
        xs.push(xs[0] + 1, xs[0] + 2, xs[0] + 3)
      } else if (x1 > x2) {
        xs.push(xs[0] - 1, xs[0] - 2, xs[0] - 3)
      }

      if (y1 < y2) {
        ys.push(ys[0] + 1, ys[0] + 2, ys[0] + 3)
      } else if (y1 > y2) {
        ys.push(ys[0], ys[0] - 1, ys[0] - 2, ys[0] - 3)
      }
    }

    for (const x of xs) {
      for (const y of ys) {
        this.setBit(x, y)
      }
    }

    if (end) {
      this.fillCorners(start, end)
    }
  }

  /**
   * @param point {[number, number]}
   * @param maxX {number}
   * @param maxY {number}
   */
  getAdjacent = ([x, y], maxX, maxY) => {
    const adjacent = []

    for (const [a, b] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (a >= 0 && a < maxX && b >= 0 && b < maxY) {
        adjacent.push([a, b])
      }
    }

    return adjacent
  }

  generate = () => {
    this.init()

    const visited = [[randomI(this.width), randomI(this.height)]]

    while (visited.length) {
      const currentI =
        randomI(10) < 1 ? randomI(visited.length) : visited.length - 1

      const current = visited[currentI]

      const emptyAdjacent = this.getAdjacent(
        current,
        this.width,
        this.height,
      ).filter(this.isCellEmpty)

      if (emptyAdjacent.length === 0) {
        visited.splice(currentI, 1)
        continue
      }

      const nextI = randomI(emptyAdjacent.length)

      const next = emptyAdjacent[nextI]

      this.setPath(current, next)

      visited.push(next)
    }
  }
}

const map = new BlobMap(20, 20, 24)
document.getElementById('refresh').onclick = refresh

refresh()

function refresh() {
  map.generate()
  renderMap(map)
}

function randomI(i) {
  return Math.floor(Math.random() * i)
}

/**
 * @param map {BlobMap}
 */
function renderMap(map) {
  for (let row = 0; row < map.data.length / 3; ++row) {
    for (let col = 0; col < map.data[0].length / 3; ++col) {
      renderTile(col, row, map)
    }
  }
}

/**
 * @param col {number}
 * @param row {number}
 * @param map {BlobMap}
 */
function renderTile(col, row, { data, tileSize, tileBitSize }) {
  const x = col * tileSize
  const y = row * tileSize

  // ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, tileSize, tileSize)

  for (let c = 0; c < 3; ++c) {
    for (let r = 0; r < 3; ++r) {
      ctx.fillStyle = colors[data[row * 3 + r][col * 3 + c]]
      ctx.lineWidth = 1
      ctx.fillRect(
        x + tileBitSize * c,
        y + tileBitSize * r,
        tileBitSize,
        tileBitSize,
      )
    }
  }
}
