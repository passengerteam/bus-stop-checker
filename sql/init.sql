CREATE TABLE stop (
	atco varchar(12) NOT NULL,
	latitude numeric(11,8) NOT NULL,
	longitude numeric(11,8) NOT NULL,
	naptan_bearing varchar(2) NULL DEFAULT NULL::character varying,
	naptan_street varchar(255) NULL DEFAULT NULL::character varying,
	osm_street varchar(255) NULL DEFAULT NULL::character varying,
	confidence_is_correct int4 NULL,
	road_bearing varchar(2) NULL DEFAULT NULL::character varying,
	difference float8 NULL,
	distance_from_road float8 NULL,
	admin_area int4 NULL,
	common_name varchar(255) NULL DEFAULT NULL::character varying,
	locality varchar(255) NULL DEFAULT NULL::character varying,
	osm_node_alat float8 NULL,
	osm_node_alon float8 NULL,
	osm_node_aid int8 NULL,
	osm_node_blat float8 NULL,
	osm_node_blon float8 NULL,
	osm_node_bid int8 NULL,
	CONSTRAINT stop_pkey PRIMARY KEY (atco)
);

CREATE INDEX stop_common_name_idx ON stop USING btree (common_name);
CREATE INDEX stop_confidence_idx ON stop USING btree (confidence_is_correct);
CREATE INDEX stop_latitude_idx ON stop USING btree (latitude);
CREATE INDEX stop_locality_idx ON stop USING btree (locality);
CREATE INDEX stop_location_2_idx ON stop USING btree (longitude, latitude);
CREATE INDEX stop_location_idx ON stop USING btree (latitude, longitude);
CREATE INDEX stop_longitude_idx ON stop USING btree (longitude);

CREATE TABLE "import" (
	id serial NOT NULL,
	"date" int4 NOT NULL,
	CONSTRAINT import_pkey PRIMARY KEY (id)
);

CREATE INDEX import_date_idx ON import USING btree (date);
