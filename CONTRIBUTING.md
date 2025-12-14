# Contributing to NeuraDNS

Thank you for your interest in contributing to NeuraDNS! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/neuradns.git
   cd neuradns
   ```
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js >= 18
- Python >= 3.8
- Solana CLI (optional)

### Installation

```bash
# Install Node.js dependencies
cd blockchain_dns_register
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### Running Locally

```bash
# Terminal 1: Start API server
cd blockchain_dns_register
npx ts-node production-api.ts

# Terminal 2: Start UI server
python app.py
```

## Code Style

### TypeScript

- Use meaningful variable names
- Add JSDoc comments for functions
- Follow existing patterns in the codebase

### Python

- Follow PEP 8 guidelines
- Use docstrings for functions
- Keep functions focused and small

### Rust (Smart Contracts)

- Follow Anchor conventions
- Document all public functions
- Include error handling

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add domain transfer functionality
fix: Resolve PDA derivation bug
docs: Update API documentation
refactor: Simplify validation logic
```

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update documentation if needed
3. Add tests for new functionality
4. Submit a pull request with a clear description

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

## Questions?

Feel free to open an issue for any questions about contributing.

---

Thank you for contributing to NeuraDNS! 🧠⛓️
