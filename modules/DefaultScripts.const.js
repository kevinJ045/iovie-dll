

export const DefaultScripts = {
  'std::igd': {
    'types': `
      Declare Type string;
      Declare Type number;
      Declare Type boolean;
      Declare Type @Declarable Namespace;
      Declare Type @Declarable Class;
      Declare Type @Declarable.Open Structure {};
      
      Inside Class Make Structure;
      Inside Namespace Make Class;
    `
  },
  'std::iovee': {
    'base': `
Declare Namespace Package name .id;
Declass Class Package.Entity name .id;
Declare Class Package.Item name .id;
Declare Class Package.Biome name .id;
Declare Class Package.BiomeStructure name .id;
Declare Class Package.RawObject name .id;
Declare Class Package.RawTexture name .id;
Declare Class Package.EffectShader name .id;
Declare Class Package.UI name .id;


Declare Variable resource = {
  source ?= "";
  type ?= "";
  loader ?= "";
};

Declare Structure Package.RawObject.resource = resource;
// ... Other structures

      `
  }
}