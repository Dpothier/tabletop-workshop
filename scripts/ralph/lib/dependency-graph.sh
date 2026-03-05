#!/bin/bash

# Ralph Wiggum - Dependency Graph Library
# Builds and manages dependency graphs from JIRA issue links

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Source config for logging functions
if [ ! -f "${PROJECT_ROOT}/.ralph/config.sh" ]; then
    echo "ERROR: config.sh not found at ${PROJECT_ROOT}/.ralph/config.sh"
    exit 1
fi
source "${PROJECT_ROOT}/.ralph/config.sh"

#
# build_graph(jira_json_file, output_file)
# Parse JIRA search results into a dependency graph
#
build_graph() {
    local jira_file="$1"
    local output_file="$2"

    if [ ! -f "$jira_file" ]; then
        log_error "JIRA JSON file not found: $jira_file"
        return 1
    fi

    log_info "Building dependency graph from $jira_file..."

    # Parse JIRA JSON and build graph
    local graph
    graph=$(jq '
    # Map JIRA status to internal state
    def status_to_state:
        if . == "To Do" then "pending"
        elif . == "In Progress" then "in_progress"
        elif . == "Done" or . == "In Review" then "completed"
        else "pending"
        end;

    # Build nodes with dependencies
    {
        nodes: (
            .issues | map(
                {
                    key: .key,
                    summary: .fields.summary,
                    status: .fields.status.name,
                    inlinks: (
                        [.fields.issuelinks[]? |
                            select(.type.name == "Blocks") |
                            if .inwardIssue then .inwardIssue.key else empty end]
                    ),
                    outlinks: (
                        [.fields.issuelinks[]? |
                            select(.type.name == "Blocks") |
                            if .outwardIssue then .outwardIssue.key else empty end]
                    )
                }
            ) |
            map(
                {
                    (.key): {
                        summary: .summary,
                        status: .status,
                        blockedBy: .inlinks,
                        blocks: .outlinks,
                        state: (.status | status_to_state)
                    }
                }
            ) |
            add
        ),
        allKeys: [.issues[].key]
    } |
    # Identify ready nodes (no blockers, pending state)
    .nodes as $nodes |
    {
        nodes: $nodes,
        ready: [
            .allKeys[] |
            select($nodes[.].blockedBy == [] and $nodes[.].state == "pending")
        ],
        chains: []
    } |
    del(.allKeys)
    ' "$jira_file")

    if [ -z "$graph" ]; then
        log_error "Failed to parse JIRA JSON"
        return 1
    fi

    # Group chains and update graph
    local chains
    chains=$(group_chains_internal "$graph")

    graph=$(echo "$graph" | jq --argjson chains "$chains" '.chains = $chains')

    echo "$graph" | jq '.' > "$output_file"
    log_success "Built dependency graph with $(echo "$graph" | jq '.nodes | length') nodes"
}

#
# group_chains_internal(graph_json)
# Helper function to group linear chains
# Returns JSON array of chains
#
group_chains_internal() {
    local graph="$1"

    jq \
        '
    def find_chain_start(key):
        # Find first node in a chain (has no blockers)
        if .nodes[key].blockedBy | length == 0 then
            key
        else
            (.nodes[key].blockedBy[0] | find_chain_start(.))
        end;

    def build_chain(key; visited):
        # Build chain starting from key, following blocks
        if (visited | index(key)) then
            []
        else
            if (.nodes[key].blocks | length == 0) then
                [key]
            elif (.nodes[key].blocks | length == 1) then
                [key] + ((.nodes[key].blocks[0]) | build_chain(.; visited + [key]))
            else
                # Multiple blocks, end chain here
                [key]
            end
        end;

    [
        .nodes | keys[] as $key |
        {
            key: $key,
            blockedBy_count: (.nodes[$key].blockedBy | length),
            blocks_count: (.nodes[$key].blocks | length)
        }
    ] |
    # Find all chain starts (nodes with no blockers)
    map(select(.blockedBy_count == 0) | .key) |
    unique |
    map(build_chain(.; []))
    ' <<< "$graph"
}

#
# detect_cycles(graph_file)
# DFS cycle detection
# Returns 0 if no cycles, 1 if cycles found (prints cycle path)
#
detect_cycles() {
    local graph_file="$1"

    if [ ! -f "$graph_file" ]; then
        log_error "Graph file not found: $graph_file"
        return 1
    fi

    log_info "Detecting cycles in dependency graph..."

    local result
    result=$(jq -n \
        --slurpfile graph "$graph_file" \
        '
    def dfs(node; visited; rec_stack; path):
        if (rec_stack | index(node)) then
            {
                hasCycle: true,
                cycle: (path + [node])
            }
        elif (visited | index(node)) then
            {hasCycle: false}
        else
            .graph[$graph[0].nodes[node].blocks[]?] as $next |
            if $next then
                dfs($next; visited + [node]; rec_stack + [node]; path + [node])
            else
                {hasCycle: false}
            end
        end;

    ($graph[0].nodes | keys[]) as $start |
    dfs($start; []; []; []) |
    if .hasCycle then
        {
            hasCycle: true,
            cycle: .cycle
        }
    else
        {hasCycle: false}
    end
    ')

    local has_cycle
    has_cycle=$(echo "$result" | jq -r '.hasCycle')

    if [ "$has_cycle" == "true" ]; then
        log_error "Cycle detected in dependency graph:"
        echo "$result" | jq -r '.cycle | join(" -> ")'
        return 1
    else
        log_success "No cycles detected"
        return 0
    fi
}

#
# topological_sort(graph_file)
# Kahn's algorithm for topological sort
# Outputs issue keys in order (respecting blockedBy)
#
topological_sort() {
    local graph_file="$1"

    if [ ! -f "$graph_file" ]; then
        log_error "Graph file not found: $graph_file"
        return 1
    fi

    log_info "Performing topological sort..."

    jq -n \
        --slurpfile graph "$graph_file" \
        '
    # Kahn'\''s algorithm
    .graph = $graph[0].nodes |
    .in_degree = {} |
    # Initialize in-degrees
    (.graph | keys[] as $key |
        (.in_degree[$key] = (.graph[$key].blockedBy | length))
    ) |
    # Find nodes with no incoming edges
    .queue = [.graph | keys[] | select(.in_degree[.] == 0)] |
    .result = [] |
    # Process queue
    until(.queue | length == 0;
        .current = .queue[0] |
        .queue |= .[1:] |
        .result += [.current] |
        # Reduce in-degree of neighbors
        (.graph[.current].blocks[] as $neighbor |
            (.in_degree[$neighbor] -= 1) |
            if .in_degree[$neighbor] == 0 then
                .queue += [$neighbor]
            else . end
        )
    ) |
    .result
    ' > /tmp/topo_sort_result.json 2>/dev/null

    if [ $? -eq 0 ]; then
        cat /tmp/topo_sort_result.json
        log_success "Topological sort completed"
        return 0
    else
        log_error "Topological sort failed"
        return 1
    fi
}

#
# group_chains(graph_file)
# Group linear chains where each node has exactly one blocker/dependent
# Returns JSON array of chains
#
group_chains() {
    local graph_file="$1"

    if [ ! -f "$graph_file" ]; then
        log_error "Graph file not found: $graph_file"
        return 1
    fi

    log_info "Grouping linear chains..."

    jq -n \
        --slurpfile graph "$graph_file" \
        '
    def find_chain_start(key):
        # Find first node in chain (no blockers)
        if $graph[0].nodes[key].blockedBy | length == 0 then
            key
        else
            ($graph[0].nodes[key].blockedBy[0] | find_chain_start(.))
        end;

    def build_chain(key; visited):
        # Build chain following blocks
        if (visited | index(key)) then
            []
        elif ($graph[0].nodes[key].blocks | length == 0) then
            [key]
        elif ($graph[0].nodes[key].blocks | length == 1) then
            [key] + build_chain($graph[0].nodes[key].blocks[0]; visited + [key])
        else
            # Multiple blocks, end chain
            [key]
        end;

    # Find all chain starts (nodes with blockedBy.length <= 1 and no multiple blockers)
    [
        $graph[0].nodes | keys[] as $key |
        {
            key: $key,
            blockedBy_count: ($graph[0].nodes[$key].blockedBy | length)
        }
    ] |
    map(select(.blockedBy_count == 0) | .key) |
    unique |
    map(build_chain(.; []))
    '
}

#
# get_ready_tasks(graph_file)
# Return JSON array of issue keys that are pending and all dependencies completed
#
get_ready_tasks() {
    local graph_file="$1"

    if [ ! -f "$graph_file" ]; then
        log_error "Graph file not found: $graph_file"
        return 1
    fi

    jq -n \
        --slurpfile graph "$graph_file" \
        '
    ($graph[0].nodes | keys[] as $key |
        if $graph[0].nodes[$key].state == "pending" and
           ($graph[0].nodes[$key].blockedBy | length == 0 or
            ($graph[0].nodes[$key].blockedBy[] |
             select($graph[0].nodes[.].state != "completed"))) == false
        then
            $key
        else
            empty
        end
    ) |
    [.]
    '
}

#
# update_task_state(graph_file, issue_key, new_state)
# Update a node'\''s state
# States: "pending", "in_progress", "completed", "failed", "conflict-blocked"
#
update_task_state() {
    local graph_file="$1"
    local issue_key="$2"
    local new_state="$3"

    if [ ! -f "$graph_file" ]; then
        log_error "Graph file not found: $graph_file"
        return 1
    fi

    if [ -z "$issue_key" ] || [ -z "$new_state" ]; then
        log_error "Usage: update_task_state <graph_file> <issue_key> <new_state>"
        return 1
    fi

    log_info "Updating state of $issue_key to $new_state"

    jq \
        --arg key "$issue_key" \
        --arg state "$new_state" \
        '.nodes[$key].state = $state' \
        "$graph_file" > /tmp/graph_update.json

    if [ $? -eq 0 ]; then
        mv /tmp/graph_update.json "$graph_file"
        log_success "Updated $issue_key state to $new_state"
        return 0
    else
        log_error "Failed to update task state"
        return 1
    fi
}

#
# get_chain_for_task(graph_file, issue_key)
# Return the full chain containing this issue key as JSON array
#
get_chain_for_task() {
    local graph_file="$1"
    local issue_key="$2"

    if [ ! -f "$graph_file" ]; then
        log_error "Graph file not found: $graph_file"
        return 1
    fi

    if [ -z "$issue_key" ]; then
        log_error "Usage: get_chain_for_task <graph_file> <issue_key>"
        return 1
    fi

    jq -n \
        --slurpfile graph "$graph_file" \
        --arg key "$issue_key" \
        '
    def find_chain_start(key):
        if $graph[0].nodes[key].blockedBy | length == 0 then
            key
        else
            ($graph[0].nodes[key].blockedBy[0] | find_chain_start(.))
        end;

    def build_chain(key; visited):
        if (visited | index(key)) then
            []
        elif ($graph[0].nodes[key].blocks | length == 0) then
            [key]
        elif ($graph[0].nodes[key].blocks | length == 1) then
            [key] + build_chain($graph[0].nodes[key].blocks[0]; visited + [key])
        else
            [key]
        end;

    (find_chain_start($key) | build_chain(.; []))
    '
}

#
# Self-test block (runs if script is executed directly, not sourced)
#
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    set -euo pipefail

    log_info "Running dependency-graph.sh self-tests..."

    # Create test JIRA JSON
    TEST_JIRA_FILE="/tmp/test_jira.json"
    cat > "$TEST_JIRA_FILE" << 'EOF'
{
  "issues": [
    {
      "key": "MFG-11",
      "fields": {
        "summary": "Setup project structure",
        "status": { "name": "To Do" },
        "issuelinks": [
          {
            "type": { "name": "Blocks" },
            "outwardIssue": { "key": "MFG-13" }
          }
        ]
      }
    },
    {
      "key": "MFG-13",
      "fields": {
        "summary": "Create UI components",
        "status": { "name": "To Do" },
        "issuelinks": [
          {
            "type": { "name": "Blocks" },
            "inwardIssue": { "key": "MFG-11" }
          },
          {
            "type": { "name": "Blocks" },
            "outwardIssue": { "key": "MFG-14" }
          }
        ]
      }
    },
    {
      "key": "MFG-14",
      "fields": {
        "summary": "Add styling",
        "status": { "name": "To Do" },
        "issuelinks": [
          {
            "type": { "name": "Blocks" },
            "inwardIssue": { "key": "MFG-13" }
          }
        ]
      }
    }
  ]
}
EOF

    TEST_GRAPH_FILE="/tmp/test_graph.json"

    log_info "Test 1: build_graph"
    if build_graph "$TEST_JIRA_FILE" "$TEST_GRAPH_FILE"; then
        log_success "  build_graph passed"
    else
        log_error "  build_graph failed"
        exit 1
    fi

    log_info "Test 2: detect_cycles"
    if detect_cycles "$TEST_GRAPH_FILE"; then
        log_success "  detect_cycles passed (no cycles found)"
    else
        log_error "  detect_cycles failed"
        exit 1
    fi

    log_info "Test 3: topological_sort"
    if TOPO_RESULT=$(topological_sort "$TEST_GRAPH_FILE"); then
        log_success "  topological_sort passed: $TOPO_RESULT"
    else
        log_error "  topological_sort failed"
        exit 1
    fi

    log_info "Test 4: group_chains"
    if CHAINS=$(group_chains "$TEST_GRAPH_FILE"); then
        log_success "  group_chains passed: $(echo "$CHAINS" | jq 'length') chains found"
    else
        log_error "  group_chains failed"
        exit 1
    fi

    log_info "Test 5: get_ready_tasks"
    if READY=$(get_ready_tasks "$TEST_GRAPH_FILE"); then
        log_success "  get_ready_tasks passed: $(echo "$READY" | jq 'length') ready tasks"
    else
        log_error "  get_ready_tasks failed"
        exit 1
    fi

    log_info "Test 6: update_task_state"
    if update_task_state "$TEST_GRAPH_FILE" "MFG-11" "in_progress"; then
        log_success "  update_task_state passed"
    else
        log_error "  update_task_state failed"
        exit 1
    fi

    log_info "Test 7: get_chain_for_task"
    if CHAIN=$(get_chain_for_task "$TEST_GRAPH_FILE" "MFG-13"); then
        log_success "  get_chain_for_task passed: $(echo "$CHAIN" | jq '@json')"
    else
        log_error "  get_chain_for_task failed"
        exit 1
    fi

    # Cleanup
    rm -f "$TEST_JIRA_FILE" "$TEST_GRAPH_FILE" /tmp/graph_update.json /tmp/topo_sort_result.json

    log_success "All self-tests passed!"
fi
