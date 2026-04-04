export type ScryfallImageUris = {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
};

export type ScryfallCardFace = {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  image_uris?: ScryfallImageUris;
  power?: string;
  toughness?: string;
  loyalty?: string;
  flavor_text?: string;
};

export type ScryfallCard = {
  id: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  set_name: string;
  artist: string;
  flavor_text?: string;
  color_identity: string[];
};

export type ScryfallAutocomplete = {
  data: string[];
};
