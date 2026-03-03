<script lang="ts" setup>
const members = ref([
	{
		name: "Alexandra N. Lenz",
		description: "Institute Director",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/b/6/csm_team_lenz_2025_5264433d37.png",
			alt: "Alexandra Lenz",
		},
	},
	{
		name: "Jakob Bal",
		description: "Research Software Engineer",
		avatar: {
			src: "",
			alt: "Jakob Bal",
		},
	},
	{
		name: "Wolfgang Koppensteiner",
		description: "Academy Scientist",
		avatar: {
			src: "",
			alt: "Wolfgang Koppensteiner",
		},
	},
	{
		name: "Kilian Kukelka",
		description: "Research Software Engineer",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/2/1/csm_team_kukelka_82c9a0bb19.png",
			alt: "Kilian Kukelka",
		},
	},
	{
		name: "Markus Pluschkovits",
		description: "Project Management and Consulting",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/d/d/csm_team_pluschkovits_a90fbb9922.png",
			alt: "Markus Pluschkovits",
		},
	},
	{
		name: "Olivia Reichl",
		description: "Research Software Engineer",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/0/2/csm_team_reichl_42d4d05d72.png",
			alt: "Olivia Reichl",
		},
	},
	{
		name: "Marie Rohler",
		description: "Research Software Assistant",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/e/8/csm_team_rohler_52bd732012.png",
			alt: "Marie Rohler",
		},
	},
	{
		name: "Daniel Schopper",
		description: "Co-Head DHRI",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/8/0/csm_team_schopper_af4a51f2a8.png",
			alt: "Daniel Schopper",
		},
	},
	{
		name: "Philipp Stöckle",
		description: "Group Leader DynAT",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/8/c/csm_team_stoeckle_1b71b0b8b2.png",
			alt: "Philipp Stöckle",
		},
	},
	{
		name: "Katharina Wünsche",
		description: "Research Software Engineer",
		avatar: {
			src: "https://www.oeaw.ac.at/fileadmin/_processed_/2/7/csm_team_wuensche_97ff68f5a4.png",
			alt: "Katharina Wünsche",
		},
	},
	{
		name: "Anja Wittibschlager",
		description: "",
		avatar: {
			src: "",
			alt: "Anja Wittibschlager",
		},
	},
]);
</script>

<template>
	<UPage
		:ui="{
			root: 'pt-6 pb-12 lg:pt-10 lg:pb-18 container',
		}"
	>
		<div class="mx-auto max-w-4xl">
			<UPageHeader
				description="A tribute to all who have worked on the LAPIS projects for the past years."
				title="The Team behind the Projects"
			>
			</UPageHeader>

			<UPageGrid class="mt-8">
				<UPageCard
					v-for="(member, index) in members"
					:key="index"
					:ui="{
						wrapper: 'flex flex-col flex-1 items-start sm:items-center sm:align-center h-32',
						body: 'p-4',
					}"
					variant="outline"
				>
					<template #body>
						<UUser
							:avatar="member.avatar"
							:description="member.description"
							:name="member.name"
							orientation="horizontal"
							size="2xl"
						></UUser>
					</template>
				</UPageCard>
			</UPageGrid>
		</div>
	</UPage>
</template>
