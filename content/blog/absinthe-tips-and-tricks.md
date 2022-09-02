---
title: "Absinthe Tips and Tricks: Generic Types"
date: 2022-09-02
slug: absinthe-tips-and-tricks
tags:
  - Elixir
  - GraphQL
  - Macros
summary: |
  Over the years, I have developed a big collection of modules and
  macros that I copy and paste in all Elixir projects using Absinthe.
  It is high time I started sharing my experience with the community.
  Today I present a simple way to build &ldquo;generic&rdquo; types.
---

When building GraphQL APIs, regardless of the specific implementation or language, you will most likely find some repeating patterns of types that occur all over your projects.
A common example would be the type for a Relay-like pagination response.

```
type PokemonConnection {
  totalCount: Int!
  edges: [PokemonEdge!]!;
  pageInfo: PageInfo!
}

type PokemonEdge {
  cursor: String!
  node: Pokemon!
}

type PageInfo {
  hasPreviousPage: Boolean!
  hasNextPage: Boolean!
  startCursor: String!
  endCursor: String!
}
```

Translated into Absinthe's definitions, it would look like this:

```elixir
defmodule PokemonWeb.Api.PokemonTypes do
  use Absinthe.Schema.Notation

  object :page_info do
    field :has_previous_page, non_null(:boolean)
    field :has_next_page, non_null(:boolean)
    field :start_cursor, non_null(:string)
    field :end_cursor, non_null(:string)
  end

  object :pokemon_edge do
    
  end
end
```
