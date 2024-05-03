

export const DefaultScripts = {
  'std::iovie': `
Declare Namespace Package .id;
Declare Class Package.Entity .id;
Declare Class Package.Item .id;
Declare Class Package.Biome .id;
Declare Class Package.BiomeStructure .id;
Declare Class Package.RawObject .id;
Declare Class Package.RawTexture .id;
Declare Class Package.EffectShader .id;
Declare Class Package.UI .id;

Declare Structure Package.Entity.baseData = {
  health = 100;
};

Declare Structure Package.Entity.resource = {
  source = "";
  type = "";
  loader = "obj";
};

Declare Structure Package.Item.resource = Copy Package.Entity.resource;
Declare Structure Package.RawObject.resource = Copy Package.Entity.resource;
Declare Structure Package.RawTexture.resource = Copy Package.Entity.resource;

Declare Structure Package.RawTexture.texture = {
  map = '[1, 1, 0, 1, 1, 0]'
};
  `
}