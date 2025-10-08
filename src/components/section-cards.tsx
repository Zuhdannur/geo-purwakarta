'use client';

import { useState, useEffect } from "react";
import { IconTrendingDown, IconTrendingUp, IconBuilding, IconMap, IconShield, IconTree } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MapStats {
  commercialBuildings: number;
  administrativeAreas: number;
  disasterRiskAreas: number;
  builtUpAreas: number;
}

export function SectionCards() {
  const [stats, setStats] = useState<MapStats>({
    commercialBuildings: 0,
    administrativeAreas: 0,
    disasterRiskAreas: 0,
    builtUpAreas: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMapStats = async () => {
      try {
        // Fetch commercial buildings data
        const commercialResponse = await fetch('/api/data/get-rumah-komersil');
        const commercialData = await commercialResponse.json();
        const commercialBuildings = commercialData.features?.length || 0;

        // Fetch administrative areas data
        const adminResponse = await fetch('/new data/layer_administrasi.geojson');
        const adminData = await adminResponse.json();
        const administrativeAreas = adminData.features?.length || 0;

        // Fetch disaster risk areas (earthquake + landslide + flood)
        const [earthquakeResponse, landslideResponse, floodResponse] = await Promise.all([
          fetch('/new data/layer_kawasan_rawan_bencana_gempa_bumi.geojson'),
          fetch('/new data/layer_kawasan_rawan_bencana_gerakan_tanah.geojson'),
          fetch('/new data/layer_rencana_pola_ruang.geojson')
        ]);

        const [earthquakeData, landslideData, floodData] = await Promise.all([
          earthquakeResponse.json(),
          landslideResponse.json(),
          floodResponse.json()
        ]);

        const disasterRiskAreas = (earthquakeData.features?.length || 0) + 
                                 (landslideData.features?.length || 0) + 
                                 (floodData.features?.length || 0);

        // Fetch built-up areas
        const builtUpResponse = await fetch('/new data/kawasan_terbangun.geojson');
        const builtUpData = await builtUpResponse.json();
        const builtUpAreas = builtUpData.features?.length || 0;

        setStats({
          commercialBuildings,
          administrativeAreas,
          disasterRiskAreas,
          builtUpAreas
        });
      } catch (error) {
        console.error('Error fetching map statistics:', error);
        // Fallback to mock data if API fails
        setStats({
          commercialBuildings: 150,
          administrativeAreas: 17,
          disasterRiskAreas: 45,
          builtUpAreas: 89
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapStats();
  }, []);

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ...
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Commercial Buildings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.commercialBuildings.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBuilding className="size-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rumah Komersil <IconBuilding className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Commercial buildings in Purwakarta
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Administrative Areas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.administrativeAreas}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconMap className="size-3" />
              Kecamatan
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Administrative regions <IconMap className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Kecamatan areas mapped
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Disaster Risk Areas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.disasterRiskAreas}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconShield className="size-3" />
              Risk Zones
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Earthquake, landslide & flood <IconShield className="size-4" />
          </div>
          <div className="text-muted-foreground">Risk assessment areas</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Built-Up Areas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.builtUpAreas}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTree className="size-3" />
              Developed
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Urban development zones <IconTree className="size-4" />
          </div>
          <div className="text-muted-foreground">Kawasan terbangun mapped</div>
        </CardFooter>
      </Card>
    </div>
  );
}
