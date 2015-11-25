# Optimalisation of client-side intermodal routeplanning

Status: draft

Client-side routeplanning is made possible with Linked Connections. These are published as Linked Data Fragments. Because these connections are ordered by their departureTime, the graph represents a Directed Acyclic Graph. Clients can calculate the earliest arrival time with the Connection Scan Algorithm (CSA).

Current implementation asks all connections that depart from a certain time and calculates the minimum spanning tree:
`https://modality1/connections?departureTime=...`

With this approach, a lot of connections are processed that aren't in your search area (time- and distance based).

In this draft, I'll introduce the concept of maptiles and how we can use this with transportdata.

Note: `footpaths` are concidered to be known by the client here

## Maptiles

Maps are built out of a collection of square images, so called tiles. Every tile has three attributes:

* `zoom` level: 0 contains the map of the earth. Every zoom level distributes the map in four squares. In order to choose the right image on that level, some kind of coordinates are needed.
* `x` coordinate: X coordinate of the tile
* `y` coordinate: Y coordinate of the tile

Departuretime is always different so caching is limited...

## LCTiles

`?departureTime=...&?tile=...&distance=...

## Next step

