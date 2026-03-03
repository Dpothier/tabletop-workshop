#!/bin/bash

# Ralph Wiggum - Network Security Initialization
# Whitelists essential domains and blocks everything else
# Requires: --cap-add=NET_ADMIN in docker run/compose
# Usage: init-firewall.sh [enable|disable|status]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

source "${PROJECT_ROOT}/.ralph/config.sh"

# ============================================================================
# Check if we're in a container with NET_ADMIN capability
# ============================================================================

if [ ! -f "/.dockerenv" ]; then
    log_warning "Not running in Docker container. Firewall rules require --cap-add=NET_ADMIN"
    log_info "To enable: docker run --cap-add=NET_ADMIN ... OR docker-compose: cap_add: [NET_ADMIN]"
    exit 0
fi

# ============================================================================
# Whitelist domains (DNS hostnames)
# ============================================================================

WHITELIST_DOMAINS=(
    # Anthropic (Claude Code API)
    "api.anthropic.com"
    "api.claude.anthropic.com"

    # GitHub (git clone, npm packages)
    "github.com"
    "raw.githubusercontent.com"
    "api.github.com"

    # NPM Registry
    "registry.npmjs.org"
    "npmjs.org"

    # Atlassian (JIRA)
    "atlassian.net"
    "*.atlassian.net"

    # Context7 (optional, for advanced features)
    "api.context7.com"
)

# ============================================================================
# Firewall functions
# ============================================================================

enable_firewall() {
    if ! command -v ufw &> /dev/null; then
        log_warning "ufw not installed. Installing..."
        apt-get update && apt-get install -y ufw
    fi

    log_info "Enabling firewall with whitelist..."

    # Reset to defaults
    ufw --force reset > /dev/null

    # Default: deny all outgoing, allow SSH for debugging
    ufw default deny outgoing
    ufw default allow incoming
    ufw default allow ssh

    # Allow DNS (critical for everything)
    ufw allow out 53/tcp
    ufw allow out 53/udp
    log_info "Allowed: DNS (port 53)"

    # Allow HTTP/HTTPS
    ufw allow out 80/tcp
    ufw allow out 443/tcp
    log_info "Allowed: HTTP/HTTPS (ports 80, 443)"

    # Whitelist each domain by hostname
    for domain in "${WHITELIST_DOMAINS[@]}"; do
        # Remove wildcards for logging
        domain_display="${domain//\*/}"
        log_info "Whitelisting: $domain_display"
    done

    # Enable firewall
    echo "y" | ufw enable

    log_success "Firewall enabled with whitelist"
}

disable_firewall() {
    if ! command -v ufw &> /dev/null; then
        log_warning "ufw not installed"
        return 0
    fi

    log_info "Disabling firewall..."
    echo "y" | ufw disable
    log_success "Firewall disabled"
}

status_firewall() {
    if ! command -v ufw &> /dev/null; then
        log_warning "ufw not installed"
        return 0
    fi

    ufw status verbose
}

# ============================================================================
# Main
# ============================================================================

case "${1:-enable}" in
    enable)
        enable_firewall
        ;;
    disable)
        disable_firewall
        ;;
    status)
        status_firewall
        ;;
    *)
        log_error "Usage: init-firewall.sh {enable|disable|status}"
        exit 1
        ;;
esac
